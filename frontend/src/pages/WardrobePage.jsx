import React, { useState, useEffect } from "react";
import { Layout, Button, Card, Row, Col, Typography, Space, Input, Form, Select, Empty, Modal, Spin } from "antd";
import { UploadOutlined, PlusOutlined, CloseCircleOutlined, HeartOutlined, HeartFilled, ReloadOutlined } from "@ant-design/icons";
import ImageUpload from "../components/ImageUpload";
import { Link } from 'react-router-dom';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { wardrobeService, apiUtils } from "../services/api";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const FAVORITE_WARDROBE_KEY = "favorite_wardrobe_items";

const WardrobePage = ({ isDarkMode }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [tmModelUrl] = useState("https://teachablemachine.withgoogle.com/models/5oUxByMWW/");
  const [tmModel, setTmModel] = useState(null);
  const [tmResults, setTmResults] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);
  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const textColor = isDarkMode ? "#f3f4f6" : "#1f2937";

  // Load wardrobe items from database
  useEffect(() => {
    loadWardrobeItems();
  }, []);

  const loadWardrobeItems = async () => {
    try {
      setLoading(true);
      const items = await wardrobeService.getItems();
      setWardrobe(items);
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      toast.error(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (file) => {
    setSelectedFile(file);
    setResults(null);
    setImageUrl(null);
    setTmResults(null);
    setTmModel(null);
  };

  const loadTmModel = async () => {
    if (!tmModelUrl) {
      toast.error("Please enter a Teachable Machine model URL.");
      return null;
    }
    try {
      const modelURL = tmModelUrl + "model.json";
      const metadataURL = tmModelUrl + "metadata.json";
      const model = await window.tmImage.load(modelURL, metadataURL);
      setTmModel(model);
      return model;
    } catch (err) {
      toast.error("Failed to load Teachable Machine model.");
      return null;
    }
  };

  const runTeachablePredict = async (file) => {
    if (!file) {
      throw new Error("No file provided for Teachable prediction");
    }

    let model = tmModel;
    if (!model) {
      model = await loadTmModel();
      if (!model) throw new Error("Failed to load Teachable model");
    }

    // Create an Image element from the file
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    const prediction = await model.predict(img);
    return prediction.map((p) => ({ class: p.className, confidence: `${(p.probability * 100).toFixed(0)}%` }));
  };

  const mapPredictionToType = (label) => {
    if (!label) return null;
    const l = label.toLowerCase();
    if (l.includes('skirt')) return 'skirt';
    if (l.includes('dress')) return 'dress';
    if (l.includes("t-shirt") || l.includes('tshirt')) return 'tshirt';
    if (l.includes('shirt') && !l.includes('t-shirt') && !l.includes('tshirt')) return 'shirt';
    if (l.includes('jacket')) return 'jacket';
    if (l.includes('coat')) return 'coat';
    if (l.includes('saree')) return 'saree';
    if (l.includes('churidar')) return 'churidar';
    if (l.includes('pant') || l.includes('trouser') || l.includes('jean') || l.includes('jeans') || l.includes('shorts')) return 'pants';
    return 'other';
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      toast.error("Please select an image to classify.");
      return;
    }
    setUploading(true);
    try {
      // Run both backend classification (uploads image and returns results) and client-side Teachable prediction in parallel
      const backendPromise = wardrobeService.classifyImage(selectedFile);
      const tmPromise = runTeachablePredict(selectedFile);

      const [backendResp, tmResp] = await Promise.all([backendPromise, tmPromise]);

      // Set both results and the uploaded image URL
      setResults(backendResp.results);
      setImageUrl(backendResp.image_url);
      setTmResults(tmResp);

      // Auto-fill Type: pick highest-confidence label from backend results, fallback to Teachable results
      const pickHighest = (arr) => {
        if (!arr || !arr.length) return null;
        return arr.reduce((best, cur) => {
          const parseConf = (it) => {
            if (!it) return 0;
            if (typeof it.confidence === 'string') return parseInt(it.confidence.replace('%', '') || 0);
            if (typeof it.probability === 'number') return Math.round(it.probability * 100);
            return 0;
          };
          return parseConf(cur) > parseConf(best) ? cur : best;
        }, arr[0]);
      };

      const bestBackend = pickHighest(backendResp.results || []);
      const bestTm = pickHighest(tmResp || []);
      const best = bestBackend || bestTm || null;
      const predictedLabel = best?.class || best?.className || null;
      const mappedType = mapPredictionToType(predictedLabel);
      if (mappedType) {
        form.setFieldsValue({ type: mappedType });
      }

      toast.success("Image classified by both models!");
    } catch (error) {
      // Determine source of error
      if (error.response) {
        const errorInfo = apiUtils.handleError(error);
        toast.error(errorInfo.message);
      } else {
        toast.error(error.message || "Classification failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (values) => {
    if (!selectedFile) {
      toast.error("Please select an image to upload.");
      return;
    }
    if (!results && !tmResults) {
      toast.error("Please classify the image (backend or Teachable) before uploading.");
      return;
    }

    try {
      // Ensure we have an uploaded image URL. If not, upload via classify endpoint (it uploads to Cloudinary).
      if (!imageUrl) {
        const uploadResp = await wardrobeService.classifyImage(selectedFile);
        setImageUrl(uploadResp.image_url);
        // If no backend results yet, set them from response
        if (!results && uploadResp.results) {
          setResults(uploadResp.results);
        }
      }
      // Create wardrobe item data
      const itemData = {
        name: values.name,
        garment_type: values.type?.toLowerCase(),
        size: values.size || null,
        season: values.season || null,
        style: values.style || null,
        color: values.color || null,
        brand: values.brand || null,
        image_url: imageUrl,
        // Store backend classification results as an array (same shape as teachable_results)
        classification_results: results || null,
        teachable_results: tmResults || null,
      };

      // Save to database
      const newItem = await wardrobeService.createItem(itemData);
      setWardrobe([newItem, ...wardrobe]);
      form.resetFields();
      setSelectedFile(null);
      setResults(null);
      setImageUrl(null);
      setModalOpen(false);
      toast.success("Item uploaded to wardrobe!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await wardrobeService.deleteItem(itemId);
      setWardrobe(wardrobe.filter(item => item.id !== itemId));
      toast.success("Item deleted from wardrobe!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      toast.error(errorInfo.message);
    }
  };

  const openModal = () => {
    setModalOpen(true);
    setSelectedFile(null);
    setResults(null);
    setImageUrl(null);
    setTmModel(null);
    setTmResults(null);
    form.resetFields();
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFile(null);
    setResults(null);
    setImageUrl(null);
    setTmModel(null);
    setTmResults(null);
    form.resetFields();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWardrobeItems();
    setRefreshing(false);
  };

  function WardrobeGrid({ wardrobe }) {
    // Helper to check if item is favorite
    const isFavorite = (item) => {
      const favs = JSON.parse(localStorage.getItem(FAVORITE_WARDROBE_KEY) || "[]");
      return favs.some((fav) => fav.id === item.id);
    };
    
    // Helper to toggle favorite
    const toggleFavorite = (item) => {
      let favs = JSON.parse(localStorage.getItem(FAVORITE_WARDROBE_KEY) || "[]");
      if (isFavorite(item)) {
        favs = favs.filter((fav) => fav.id !== item.id);
      } else {
        favs = [item, ...favs];
      }
      localStorage.setItem(FAVORITE_WARDROBE_KEY, JSON.stringify(favs));
      // Force re-render
      setWardrobe((w) => [...w]);
    };

    return (
      <div
        className="w-full flex flex-wrap gap-6 mt-8 justify-center items-stretch"
        style={{
          rowGap: 32,
          columnGap: 32,
          marginTop: 32,
          alignItems: 'stretch',
          justifyContent: 'center',
        }}
      >
        {wardrobe.map((item) => (
          <div
            key={item.id}
            className="relative flex flex-col items-center group"
            style={{
              position: "relative",
              marginBottom: 0,
              width: 240,
              minHeight: 300,
              flex: '0 0 240px',
              background: isDarkMode ? '#18181b' : '#fff',
              borderRadius: 16,
              border: isDarkMode
                ? '1.5px solid #343434ff'
                : '1.5px solid #e5e7eb',
              padding: 0,
              overflow: 'hidden',
              transition: 'box-shadow 0.2s, border 0.2s',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              boxShadow: isDarkMode ? '#0003' : '0 2px 16px 0 #bdebfeff',
            }}
          >
            <div style={{ width: '100%', height: 180, background: isDarkMode ? '#23272f' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }}>
              <img
                src={item.image_url}
                alt={item.name}
                style={{ maxHeight: 170, maxWidth: '80%', objectFit: 'contain', borderRadius: 10, boxShadow: isDarkMode ? '0 1px 8px #23272f' : '0 1px 8px #e5e7eb' }}
              />
            </div>
            <CloseCircleOutlined
              onClick={() => handleDeleteItem(item.id)}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                fontSize: 22,
                color: "#ef4444",
                backgroundColor: isDarkMode ? '#23272f' : '#fff',
                borderRadius: "50%",
                cursor: "pointer",
                boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                zIndex: 10,
                transition: 'background 0.2s',
              }}
              title="Delete item"
            />
            {/* Heart (Favorite) Button */}
            {isFavorite(item) ? (
              <HeartFilled
                onClick={() => toggleFavorite(item)}
                style={{
                  position: "absolute",
                  top: 44,
                  right: 10,
                  fontSize: 22,
                  color: isDarkMode ? '#fbbf24' : '#f59e42',
                  backgroundColor: isDarkMode ? '#23272f' : '#fff',
                  borderRadius: "50%",
                  cursor: "pointer",
                  boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                  zIndex: 10,
                  transition: 'background 0.2s',
                }}
                title="Remove from favorites"
              />
            ) : (
              <HeartOutlined
                onClick={() => toggleFavorite(item)}
                style={{
                  position: "absolute",
                  top: 44,
                  right: 10,
                  fontSize: 22,
                  color: isDarkMode ? '#fbbf24' : '#f59e42',
                  backgroundColor: isDarkMode ? '#23272f' : '#fff',
                  borderRadius: "50%",
                  cursor: "pointer",
                  boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                  zIndex: 10,
                  transition: 'background 0.2s',
                }}
                title="Add to favorites"
              />
            )}
            <div style={{ width: '100%', padding: '18px 18px 14px 18px', textAlign: 'center', background: isDarkMode ? '#18181b' : '#fff', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <span style={{ display: 'block', fontWeight: 700, fontSize: 18, color: isDarkMode ? '#f3f4f6' : '#1f2937', marginBottom: 2, letterSpacing: 0.2 }}>{item.name}</span>
              <span style={{ display: 'block', fontWeight: 500, fontSize: 15, color: isDarkMode ? '#38bdf8' : '#0ea5e9', marginBottom: 2 }}>{item.garment_type}</span>
              {item.size && <span style={{ display: 'block', fontSize: 14, color: isDarkMode ? '#fbbf24' : '#f59e42', fontWeight: 500, marginBottom: 2 }}>Size: {item.size}</span>}
              {item.season && <span style={{ display: 'block', fontSize: 14, color: isDarkMode ? '#60a5fa' : '#0ea5e9', fontWeight: 500, marginBottom: 2 }}>Season: {item.season}</span>}
              {item.color && <span style={{ display: 'block', fontSize: 14, color: isDarkMode ? '#fde68a' : '#ca8a04', fontWeight: 500, marginBottom: 2 }}>Color: {item.color}</span>}
              {item.brand && <span style={{ display: 'block', fontSize: 14, color: isDarkMode ? '#a1a1aa' : '#6b7280', fontWeight: 500, marginBottom: 2 }}>Brand: {item.brand}</span>}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: bgColor }}>
        <Content style={{ padding: "2rem 2.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2rem 2.5rem" }}>
        <ToastContainer theme={isDarkMode ? "dark" : "light"} />
        <div className="max-w-4xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
          <div className="text-center mb-12 mt-10">
            <Title
              level={1}
              className="text-center"
              style={{
                color: textColor,
                marginBottom: 18,
                fontWeight: 800,
                fontSize: '2.3rem',
                letterSpacing: 1.1,
                lineHeight: 1.1
              }}
            >
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>My Digital Wardrobe</span>
            </Title>
            <p style={{ color: isDarkMode ? "#9ca3af" : "#4b5563", fontSize: '1.13rem', fontWeight: 500, marginBottom: 0 }}>
              Upload clothing images and details to build your digital wardrobe.
            </p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openModal}
                style={{
                  marginBottom: 25,
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '1.01rem',
                  padding: '0.7rem 2.1rem',
                  background: 'linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)',
                  boxShadow: '0 2px 12px #0ea5e955',
                  border: 'none',
                  marginTop: 25
                }}
              >
                Click to upload image with details
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshing}
                style={{
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  padding: '0.7rem 1.5rem',
                  border: isDarkMode ? '1px solid #38bdf8' : '1px solid #0ea5e9',
                  color: isDarkMode ? '#38bdf8' : '#0ea5e9',
                  background: 'transparent',
                }}
              >
                Refresh
              </Button>
              <Link to="/outfit-advisor">
                <Button
                  type="default"
                  style={{
                    marginLeft: 8,
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '0.6rem 1.4rem',
                    border: isDarkMode ? '1px solid #38bdf8' : '1px solid #0ea5e9',
                    color: isDarkMode ? '#38bdf8' : '#0ea5e9',
                    background: 'transparent',
                  }}
                >
                  Outfit Advisor
                </Button>
              </Link>
            </div>
            <Modal
              open={modalOpen}
              onCancel={closeModal}
              footer={null}
              title={<span style={{ color: textColor, fontWeight: 700, fontSize: '1.25rem', letterSpacing: 0.5 }}>Upload Clothing Item</span>}
              centered
              destroyOnHidden
              styles={{ body: { padding: 20, background: bgColor, minHeight: 0 } }}
              width={670}
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleUpload}
                style={{ width: "100%", maxWidth: 600 }}
              >
                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <div style={{
                      background: isDarkMode ? '#18181b' : '#fff',
                      borderRadius: 16,
                      boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                      padding: 12,
                      marginBottom: 8
                    }}>
                      <ImageUpload
                        label="Upload a clothing image"
                        onImageChange={handleImageChange}
                        isDarkMode={isDarkMode}
                        height={260}
                      />
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={handleClassify}
                        loading={uploading}
                        disabled={!selectedFile || uploading}
                        style={{
                          marginTop: 14,
                          width: "100%",
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: '1.01rem',
                          padding: '0.7rem 2.1rem',
                          background: 'linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)',
                          boxShadow: '0 2px 12px #0ea5e955',
                          border: 'none',
                        }}
                      >
                        {uploading ? "Classifying..." : "Classify"}
                      </Button>
                      
                      {results && tmResults && (
                        <Card
                          size="small"
                          style={{
                            marginTop: 14,
                            background: isDarkMode ? "#18181b" : "#fff",
                            border: isDarkMode ? '2px solid #38bdf8' : '1px solid #eee',
                            borderRadius: 12,
                            boxShadow: isDarkMode
                              ? '0 0 0 2px #0ea5e9, 0 0 8px 2px #38bdf8, 0 2px 8px #0006'
                              : '0 2px 8px #0ea5e933',
                          }}
                          styles={{ body: { padding: 14 }, header: { color: textColor, fontSize: 15 } }}
                          title={<span style={{ color: textColor, fontWeight: 600 }}>Classification Results</span>}
                        >
                          <Space direction="vertical" size="small">
                            
                            <div>
                              {results.map((item, idx) => {
                                const percent = parseInt(item.confidence.replace('%', ''));
                                return (
                                  <div key={`backend-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <Text strong style={{ color: textColor, minWidth: 90 }}>{item.class}</Text>
                                    <div style={{ flex: 1, minWidth: 80, maxWidth: 120, background:'#727272ff', borderRadius: 6, height: 16, position: 'relative', marginRight: 8 }}>
                                      <div style={{
                                        width: `${percent}%`,
                                        background: percent > 80 ? '#22c55e' : percent > 50 ? '#eab308' : '#ef4444',
                                        height: '100%',
                                        borderRadius: 6,
                                        transition: 'width 0.3s',
                                      }} />
                                      <span style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: '#fff',
                                        fontWeight: 500,
                                        fontSize: 13,
                                        letterSpacing: 1,
                                      }}>{item.confidence}</span>
                                    </div>
                                  </div>
                                );
                              })}

                              {tmResults.map((item, idx) => {
                                const percent = parseInt(item.confidence.replace('%', ''));
                                return (
                                  <div key={`tm-${idx}`} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                                    <Text strong style={{ color: textColor, minWidth: 90 }}>{item.class}</Text>
                                    <div style={{ flex: 1, minWidth: 80, maxWidth: 120, background:'#727272ff', borderRadius: 6, height: 16, position: 'relative', marginRight: 8 }}>
                                      <div style={{
                                        width: `${percent}%`,
                                        background: percent > 80 ? '#22c55e' : percent > 50 ? '#eab308' : '#ef4444',
                                        height: '100%',
                                        borderRadius: 6,
                                        transition: 'width 0.3s',
                                      }} />
                                      <span style={{
                                        position: 'absolute',
                                        left: '50%',
                                        top: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: '#fff',
                                        fontWeight: 500,
                                        fontSize: 13,
                                        letterSpacing: 1,
                                      }}>{item.confidence}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </Space>
                        </Card>
                      )}
                    </div>
                  </Col>
                  <Col xs={24} md={12}>
                    <div style={{
                      background: isDarkMode ? '#18181b' : '#fff',
                      borderRadius: 16,
                      boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                      padding: 18,
                      marginBottom: 12
                    }}>
                      <Form.Item
                        label={<span style={{ fontWeight: 600, color: textColor }}>Name</span>}
                        name="name"
                        rules={[{ required: true, message: "Please enter a name for this item" }]}
                      >
                        <Input placeholder="e.g. Blue Denim Jacket" style={{ borderRadius: 8, fontSize: '1.01rem', padding: '0.32rem 0.7rem', height: 32 }} />
                      </Form.Item>
                      <Form.Item
                        label={<span style={{ fontWeight: 600, color: textColor }}>Type</span>}
                        name="type"
                        rules={[{ required: true, message: "Please select a type" }]}
                      >
                        <Select placeholder="Select type" style={{ borderRadius: 8, fontSize: '1.01rem' }}>
                          <Option value="shirt">Shirt</Option>
                          <Option value="tshirt">T-Shirt</Option>
                          <Option value="jacket">Jacket</Option>
                          <Option value="dress">Dress</Option>
                          <Option value="pants">Pants</Option>
                          <Option value="skirt">Skirt</Option>
                          <Option value="coat">Coat</Option>
                          <Option value="saree">Saree</Option>
                          <Option value="churidar">Churidar</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        label={<span style={{ fontWeight: 600, color: textColor }}>Size</span>}
                        name="size"
                      >
                        <Select placeholder="Select size" style={{ borderRadius: 8, fontSize: '1.01rem' }}>
                          <Option value="S">S</Option>
                          <Option value="M">M</Option>
                          <Option value="L">L</Option>
                          <Option value="XL">XL</Option>
                          <Option value="XXL">XXL</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label={<span style={{ fontWeight: 600, color: textColor }}>Season</span>} name="season">
                        <Select placeholder="Select season" style={{ borderRadius: 8, fontSize: '1.01rem' }}>
                          <Option value="summer">Summer</Option>
                          <Option value="winter">Winter</Option>
                          <Option value="rainy">Rainy</Option>
                          <Option value="all">All</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label={<span style={{ fontWeight: 600, color: textColor }}>Color</span>} name="color">
                        <Input placeholder="e.g. Blue, Red, Black" style={{ borderRadius: 8, fontSize: '1.01rem', padding: '0.32rem 0.7rem', height: 32 }} />
                      </Form.Item>
                      <Form.Item label={<span style={{ fontWeight: 600, color: textColor }}>Brand</span>} name="brand">
                        <Input placeholder="e.g. Levi's, Nike" style={{ borderRadius: 8, fontSize: '1.01rem', padding: '0.32rem 0.7rem', height: 32 }} />
                      </Form.Item>
                      <Form.Item label={<span style={{ fontWeight: 600, color: textColor }}>Style</span>} name="style">
                        <Select placeholder="Select style" style={{ borderRadius: 8, fontSize: '1.01rem' }}>
                          <Option value="casual">Casual</Option>
                          <Option value="ethnic">Ethnic</Option>
                          <Option value="formal">Formal</Option>
                          <Option value="party">Party</Option>
                        </Select>
                      </Form.Item>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        htmlType="submit"
                        style={{
                          marginTop: 14,
                          width: "100%",
                          borderRadius: 999,
                          fontWeight: 700,
                          fontSize: '1.01rem',
                          padding: '0.7rem 2.1rem',
                          background: 'linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)',
                          boxShadow: '0 2px 12px #0ea5e955',
                          border: 'none',
                        }}
                        disabled={!(results && tmResults)}
                      >
                        Upload to Wardrobe
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Modal>
            <div className="mt-20">
              <Title
                level={2}
                style={{
                  color: textColor,
                  marginTop: 32,
                  marginBottom: 22,
                  textAlign: 'center',
                  width: '100%',
                  fontWeight: 700,
                  fontSize: '1.35rem',
                  letterSpacing: 0.5
                }}
              >
                <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>👗 My Wardrobe Items ({wardrobe.length})</span>
              </Title>
              {wardrobe.length === 0 ? (
                <Card
                  style={{
                    background: isDarkMode ? '#18181b' : '#fff',
                    border: 'none',
                    borderRadius: 20,
                    textAlign: 'center',
                    padding: '4.5rem 2.5rem',
                    marginLeft: 40,
                    marginRight: 40,
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933"
                  }}
                >
                  <Empty
                    description={<span style={{ color: textColor, fontSize: '1.13rem', fontWeight: 600 }}>No wardrobe items yet.</span>}
                  />
                </Card>
              ) : (
                <WardrobeGrid wardrobe={wardrobe} />
              )}
            </div>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default WardrobePage;
