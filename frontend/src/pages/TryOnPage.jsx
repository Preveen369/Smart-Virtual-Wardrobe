import { useState, useEffect, useRef } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Select } from 'antd';
import {
  Layout,
  ConfigProvider,
  theme,
  Button,
  Typography,
  Space,
  Switch,
  Input,
  Row,
  Col,
  Divider,
} from "antd";
import {
  BulbOutlined,
  BulbFilled,
  DownOutlined,
  UpOutlined,
  HeartOutlined,
  HeartFilled,
} from "@ant-design/icons";
import ImageUpload from "../components/ImageUpload";
import { tryOnService, apiUtils } from "../services/api";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const FAVORITE_TRYON_KEY = "favorite_tryon_results";

function TryOnPage({ isDarkMode, setIsDarkMode }) {
  const [personImage, setPersonImage] = useState(null);
  const [clothImage, setClothImage] = useState(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const [modelType, setModelType] = useState("");
  const [gender, setGender] = useState("");
  const [garmentType, setGarmentType] = useState("");
  const [style, setStyle] = useState("");

  const { Option } = Select;

  const resultRef = useRef(null);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [result]);

  // Listen for storage changes to sync favorite status across tabs/pages
  useEffect(() => {
    const syncFavorite = () => {
      if (result) {
        const favs = JSON.parse(localStorage.getItem(FAVORITE_TRYON_KEY) || "[]");
        setIsFavorite(!!favs.find((item) => item.id === result.id));
      }
    };
    window.addEventListener('storage', syncFavorite);
    return () => window.removeEventListener('storage', syncFavorite);
  }, [result]);

  useEffect(() => {
    if (result) {
      const favs = JSON.parse(localStorage.getItem(FAVORITE_TRYON_KEY) || "[]");
      setIsFavorite(!!favs.find((item) => item.id === result.id));
    }
  }, [result]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personImage || !clothImage) {
      toast.error("Please upload both person and cloth images");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("person_image", personImage);
    formData.append("cloth_image", clothImage);
    formData.append("instructions", instructions);
    formData.append("model_type", modelType || "");
    formData.append("gender", gender || "");
    formData.append("garment_type", garmentType || "");
    formData.append("style", style || "");

    try {
      // Perform try-on
      const response = await tryOnService.tryOn(formData);

      const newResult = {
        id: response.session_id || Date.now(),
        resultImage: response.image,
        text: response.text,
        timestamp: new Date().toLocaleString(),
      };

      setResult(newResult);
      
      // Save to localStorage history
      const prevHistory = JSON.parse(localStorage.getItem('tryon_history') || '[]');
      localStorage.setItem('tryon_history', JSON.stringify([newResult, ...prevHistory]));
      
      toast.success("Virtual try-on completed successfully!");
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      toast.error(errorInfo.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = () => {
    if (!result) return;
    let favs = JSON.parse(localStorage.getItem(FAVORITE_TRYON_KEY) || "[]");
    let updated;
    if (isFavorite) {
      updated = favs.filter((item) => item.id !== result.id);
      setIsFavorite(false);
    } else {
      updated = [result, ...favs];
      setIsFavorite(true);
    }
    localStorage.setItem(FAVORITE_TRYON_KEY, JSON.stringify(updated));
    // Dispatch a storage event for cross-tab sync
    window.dispatchEvent(new Event('storage'));
  };

  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
          colorPrimary: "#0ea5e9",
          borderRadius: 10,
        },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: bgColor }}>
        <Header
          style={{
            background: "transparent",
            display: "flex",
            alignItems: "center",
            padding: "1.5rem 2rem",
          }}
        >
          
        </Header>
        <Content style={{ padding: "2rem 2.5rem" }}>
          <div className="max-w-5xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
            <Title
              level={1}
              className="text-center"
              style={{
                color: textColor,
                marginBottom: 44,
                fontWeight: 800,
                fontSize: '2.3rem',
                letterSpacing: 1.1,
                lineHeight: 1.1
              }}
            >
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>Try-On Clothes in Seconds</span>
            </Title>

            <form onSubmit={handleSubmit}>
              <Row gutter={[40, 40]}>
                {/* Model Section */}
                <Col xs={24} md={12}>
                  <div
                    style={{
                      background: cardColor,
                      padding: 32,
                      borderRadius: 20,
                      boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                      minHeight: 340,
                      marginBottom: 8
                    }}
                  >
                    <Title
                      level={4}
                      style={{ color: textColor, marginBottom: 18, fontWeight: 700, fontSize: '1.18rem', letterSpacing: 0.3 }}
                    >
                      <span style={{ borderBottom: `2.5px solid #0ea5e9`, paddingBottom: 2 }}>Model Image</span>
                    </Title>

                    <ImageUpload
                      label="Upload Model Image"
                      onImageChange={setPersonImage}
                      isDarkMode={isDarkMode}
                    />

                    <div className="mt-7 space-y-4">
                      {/* Model Type */}
                      <div>
                        <Text style={{ color: subText, fontWeight: 500 }}>Model Type</Text>
                        <Select
                          placeholder="Select model type"
                          style={{ width: "100%", marginTop: 6, borderRadius: 8 }}
                          value={modelType}
                          onChange={setModelType}
                        >
                          <Option value="top">Top Half</Option>
                          <Option value="bottom">Bottom Half</Option>
                          <Option value="full">Full Body</Option>
                        </Select>
                      </div>

                      {/* Gender */}
                      <div>
                        <Text style={{ color: subText, fontWeight: 500 }}>Gender</Text>
                        <Select
                          placeholder="Select gender"
                          style={{ width: "100%", marginTop: 6, borderRadius: 8 }}
                          value={gender}
                          onChange={setGender}
                        >
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Col>

                {/* Garment Section */}
                <Col xs={24} md={12}>
                  <div
                    style={{
                      background: cardColor,
                      padding: 32,
                      borderRadius: 20,
                      boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                      minHeight: 340,
                      marginBottom: 8
                    }}
                  >
                    <Title
                      level={4}
                      style={{ color: textColor, marginBottom: 18, fontWeight: 700, fontSize: '1.18rem', letterSpacing: 0.3 }}
                    >
                      <span style={{ borderBottom: `2.5px solid #0ea5e9`, paddingBottom: 2 }}>Garment Image</span>
                    </Title>

                    <ImageUpload
                      label="Upload Cloth Image"
                      onImageChange={setClothImage}
                      isDarkMode={isDarkMode}
                    />

                    <div className="mt-7 space-y-4">
                      {/* Garment Type */}
                      <div>
                        <Text style={{ color: subText, fontWeight: 500 }}>Garment Type</Text>
                        <Select
                          placeholder="Select garment type"
                          style={{ width: "100%", marginTop: 6, borderRadius: 8 }}
                          value={garmentType}
                          onChange={setGarmentType}
                        >
                          <Option value="shirt">Shirt</Option>
                          <Option value="pants">Pants</Option>
                          <Option value="jacket">Jacket</Option>
                          <Option value="dress">Dress</Option>
                          <Option value="tshirt">T-shirt</Option>
                          <Option value="saree">Saree</Option>
                          <Option value="churidar">Churidar</Option>
                          <Option value="skirt">Skirt</Option>
                          <Option value="coat">Coat</Option>
                        </Select>

                      </div>

                      {/* Style */}
                      <div>
                        <Text style={{ color: subText, fontWeight: 500 }}>Style</Text>
                        <Select
                          placeholder="Select style"
                          style={{ width: "100%", marginTop: 6, borderRadius: 8 }}
                          value={style}
                          onChange={setStyle}
                        >
                          <Option value="casual">Casual</Option>
                          <Option value="formal">Formal</Option>
                          <Option value="business">Business</Option>
                          <Option value="sporty">Sporty</Option>
                          <Option value="elegant">Elegant</Option>
                          <Option value="bohemian">Bohemian</Option>
                          <Option value="vintage">Vintage</Option>
                          <Option value="modern">Modern</Option>
                          <Option value="traditional">Traditional</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Submit Button */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "2.5rem",
                  width: "100%"
                }}
              >
                <Button
                  type="primary"
                  size="large"
                  htmlType="submit"
                  loading={loading}
                  style={{
                    height: 48,
                    minWidth: 180,
                    fontSize: 16,
                    borderRadius: 999,
                    fontWeight: 700,
                    background: 'linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)',
                    boxShadow: '0 2px 12px #0ea5e955',
                    letterSpacing: 0.5,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    padding: '0 1.5rem'
                  }}
                >
                  {loading ? (
                    <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#fff', width: '100%', textAlign: 'center' }}>Processing...</span>
                  ) : (
                    <>
                      <span style={{ fontWeight: 700, fontSize: '1.08rem', color: '#fff', width: '100%', textAlign: 'center', marginRight: 10 }}>Try On</span>
                      <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </>
                  )}
                </Button>
              </div>
            </form>

            {result && (
              <div ref={resultRef} className="mt-20">
                <Divider />
                
                <div className="flex justify-center">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={result.resultImage}
                      alt="Try-On Result"
                      style={{
                        borderRadius: 16,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        maxHeight: 480,
                        display: 'block',
                      }}
                    />
                    {/* Heart (Favorite) Button inside the image */}
                    {isFavorite ? (
                      <HeartFilled
                        onClick={handleFavorite}
                        style={{
                          position: "absolute",
                          top: 18,
                          right: 18,
                          fontSize: 32,
                          color: isDarkMode ? '#fbbf24' : '#f59e42',
                          backgroundColor: isDarkMode ? '#23272f' : '#fff',
                          borderRadius: "50%",
                          cursor: "pointer",
                          boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                          zIndex: 10,
                          padding: 8,
                          transition: 'background 0.2s',
                          opacity: 0.92,
                        }}
                        title="Remove from favorites"
                      />
                    ) : (
                      <HeartOutlined
                        onClick={handleFavorite}
                        style={{
                          position: "absolute",
                          top: 18,
                          right: 18,
                          fontSize: 32,
                          color: isDarkMode ? '#fbbf24' : '#f59e42',
                          backgroundColor: isDarkMode ? '#23272f' : '#fff',
                          borderRadius: "50%",
                          cursor: "pointer",
                          boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                          zIndex: 10,
                          padding: 8,
                          transition: 'background 0.2s',
                          opacity: 0.92,
                        }}
                        title="Add to favorites"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Previous Results Accordion */}
            {/* Removed: history and showHistory rendering. Now handled in HistoryPage. */}
          </div>
        </Content>

        <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      </Layout>
    </ConfigProvider>
  );
}

export default TryOnPage;