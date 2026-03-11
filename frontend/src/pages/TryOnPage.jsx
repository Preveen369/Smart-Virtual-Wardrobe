import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// removed Select dropdowns per request
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
import { tryOnService, apiUtils, favoritesService } from "../services/api";

const { Header, Content } = Layout;
const { Title, Text } = Typography;


function TryOnPage({ isDarkMode }) {
  const [personImage, setPersonImage] = useState(null);
  const [clothImage, setClothImage] = useState(null);
  const [instructions, _setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [tryonFavorites, setTryonFavorites] = useState([]);

  // dropdown fields removed

  

  const { defaultAlgorithm, darkAlgorithm } = theme;

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // load current favorites once
  useEffect(() => {
    const loadFavs = async () => {
      try {
        const favs = await favoritesService.list('tryon');
        setTryonFavorites(favs);
      } catch (err) {
        console.error('failed to load tryon favorites', err);
      }
    };
    loadFavs();
  }, []);

  // update isFavorite when result or favorites change
  useEffect(() => {
    if (result) {
      const fav = tryonFavorites.find((f) => f.item.id === result.id);
      setIsFavorite(!!fav);
    }
  }, [result, tryonFavorites]);

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
    // dropdown fields removed; backend will use defaults

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

  const handleFavorite = async () => {
    if (!result) return;
    try {
      if (isFavorite) {
        const rec = tryonFavorites.find((f) => f.item.id === result.id);
        if (rec) {
          await favoritesService.delete(rec.id);
          setTryonFavorites((prev) => prev.filter((f) => f.id !== rec.id));
          setIsFavorite(false);
        }
      } else {
        const favObj = { ...result };
        const created = await favoritesService.create('tryon', favObj);
        setTryonFavorites((prev) => [created, ...prev]);
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('favorite toggle error', err);
    }
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

                    <div className="mt-7" />
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

                    <div className="mt-7" />
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
              <div className="mt-20">
                <Divider />
                
                <div className="flex justify-center">
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={result.resultImage}
                      alt="Try-On Result"
                      style={{
                        borderRadius: 16,
                        boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                        height: 480,
                        width: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                      draggable={false}
                      loading="lazy"
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