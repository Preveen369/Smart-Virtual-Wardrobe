import React, { useState, useEffect } from "react";
import { Layout, Typography, Card, Row, Col, Button, Empty, Tag } from "antd";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const FAVORITE_TRYON_KEY = "favorite_tryon_results";
const FAVORITE_WARDROBE_KEY = "favorite_wardrobe_items";

const FavoritesPage = ({ isDarkMode }) => {
  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  const [favoriteTryon, setFavoriteTryon] = useState([]);
  const [favoriteWardrobe, setFavoriteWardrobe] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = () => {
      const tryon = JSON.parse(
        localStorage.getItem(FAVORITE_TRYON_KEY) || "[]"
      );
      const wardrobe = JSON.parse(
        localStorage.getItem(FAVORITE_WARDROBE_KEY) || "[]"
      );
      setFavoriteTryon(tryon);
      setFavoriteWardrobe(wardrobe);
      setLoading(false);
    };
    loadFavorites();
    window.addEventListener("storage", loadFavorites);
    return () => window.removeEventListener("storage", loadFavorites);
  }, []);

  if (loading)
    return (
      <div style={{ color: textColor, textAlign: "center", marginTop: 80 }}>
        Loading...
      </div>
    );

  const hasFavorites = favoriteTryon.length > 0 || favoriteWardrobe.length > 0;

  // Remove a try-on favorite
  const removeTryonFavorite = (id) => {
    const updated = favoriteTryon.filter((item) => item.id !== id);
    setFavoriteTryon(updated);
    localStorage.setItem(FAVORITE_TRYON_KEY, JSON.stringify(updated));
  };
  // Remove a wardrobe favorite
  const removeWardrobeFavorite = (id) => {
    const updated = favoriteWardrobe.filter((item) => item.id !== id);
    setFavoriteWardrobe(updated);
    localStorage.setItem(FAVORITE_WARDROBE_KEY, JSON.stringify(updated));
  };

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2.5rem 1.5rem", background: bgColor }}>
        <div
          className="max-w-6xl mx-auto"
          style={{ paddingLeft: 16, paddingRight: 16 }}
        >
          {/* Header Section */}
          <div className="text-center mb-16 mt-10">
            <Title
              level={1}
              style={{
                color: textColor,
                marginBottom: 18,
                fontSize: "2.7rem",
                fontWeight: 800,
                letterSpacing: 1.1,
                lineHeight: 1.1,
              }}
            >
              <span
                style={{
                  color: "#0ea5e9",
                  borderBottom: "4px solid #0ea5e9",
                  paddingBottom: 4,
                }}
              >
                My Favorites
              </span>
            </Title>
            <Text
              style={{
                color: subText,
                fontSize: "1.18rem",
                display: "block",
                marginBottom: 30,
                fontWeight: 500,
              }}
            >
              Your saved outfits, styles, and favorite combinations
            </Text>
          </div>

          {/* Favorites Grid */}
          <div>
            <Row gutter={[32, 32]}>
              {/* Favorite Wardrobe Items Section */}
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 32, marginLeft: 12 }}>
                  <Title
                    level={3}
                    style={{
                      color: textColor,
                      marginBottom: 18,
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      letterSpacing: 0.5,
                    }}
                  >
                    <span
                      style={{
                        borderBottom: `3px solid #0ea5e9`,
                        paddingBottom: 4,
                      }}
                    >
                      Favorite Wardrobe Items
                    </span>
                  </Title>
                  {favoriteWardrobe.length === 0 ? (
                    <Card
                      style={{
                        background: cardColor,
                        border: "none",
                        borderRadius: 22,
                        textAlign: "center",
                        padding: "3rem 1.5rem",
                        boxShadow: isDarkMode
                          ? "0 2px 16px #0006"
                          : "0 2px 16px #0ea5e933",
                      }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text style={{ color: subText, fontSize: "1.01rem" }}>
                            No favorite wardrobe items yet
                          </Text>
                        }
                      />
                    </Card>
                  ) : (
                    <Row gutter={[24, 24]}>
                      {favoriteWardrobe.map((item, idx) => (
                        <Col xs={24} sm={12} key={item.timestamp || idx}>
                          <Card
                            hoverable
                            style={{
                              background: cardColor,
                              border:
                                "1.5px solid " +
                                (isDarkMode ? "#23272f" : "#e5e7eb"),
                              borderRadius: 22,
                              textAlign: "center",
                              boxShadow: isDarkMode
                                ? "0 2px 16px #0003"
                                : "0 2px 16px #0ea5e922",
                              marginBottom: 10,
                              position: "relative",
                              padding: "0.4rem 0.5rem 0 0.5rem",
                              overflow: "hidden",
                              minHeight: 340,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              transition: "box-shadow 0.2s, border 0.2s",
                            }}
                            bodyStyle={{
                              padding: "1.2rem 0.5rem 1.2rem 0.5rem",
                            }}
                            cover={
                              <div
                                style={{
                                  position: "relative",
                                  background: isDarkMode
                                    ? "#18181b"
                                    : "#f3f4f6",
                                  borderTopLeftRadius: 22,
                                  borderTopRightRadius: 22,
                                  padding: 12,
                                }}
                              >
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  style={{
                                    borderRadius: 14,
                                    maxHeight: 180,
                                    minHeight: 120,
                                    objectFit: "cover",
                                    margin: "auto",
                                    width: "100%",
                                    background: isDarkMode ? "#23272f" : "#fff",
                                    border: isDarkMode
                                      ? "1px solid #23272f"
                                      : "1px solid #e5e7eb",
                                    boxShadow: "none",
                                    display: "block",
                                  }}
                                />
                                <HeartFilled
                                  onClick={() =>
                                    removeWardrobeFavorite(item.id)
                                  }
                                  style={{
                                    position: "absolute",
                                    top: 14,
                                    right: 14,
                                    fontSize: 22,
                                    color: isDarkMode ? "#fbbf24" : "#f59e42",
                                    backgroundColor: isDarkMode
                                      ? "#23272f"
                                      : "#fff",
                                    border: isDarkMode
                                      ? "1.5px solid #333"
                                      : "1.5px solid #e5e7eb",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    boxShadow: "none",
                                    zIndex: 10,
                                    padding: 4,
                                    transition: "background 0.2s",
                                  }}
                                  title="Remove from favorites"
                                />
                              </div>
                            }
                          >
                            <div
                              style={{
                                minHeight: 30,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Text
                                style={{
                                  color: isDarkMode ? "#fff" : "#1f2937",
                                  fontWeight: 700,
                                  fontSize: 20,
                                  marginBottom: 2,
                                }}
                              >
                                {item.name}
                              </Text>
                              <Text
                                style={{
                                  color: isDarkMode ? "#fff" : "#0ea5e9",
                                  fontSize: 16,
                                  fontWeight: 600,
                                  marginBottom: 2,
                                }}
                              >
                                {item.garment_type}
                              </Text>
                              {item.color && (
                                <Text
                                  style={{
                                    color: isDarkMode ? "#fff" : "#ca8a04",
                                    fontWeight: 600,
                                    fontSize: 15,
                                    marginBottom: 2,
                                  }}
                                >
                                  Color: {item.color}
                                </Text>
                              )}
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Col>
              {/* Favorite Virtual Outfits Section */}
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 32, marginRight: 12 }}>
                  <Title
                    level={3}
                    style={{
                      color: textColor,
                      marginBottom: 18,
                      textAlign: "center",
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      letterSpacing: 0.5,
                    }}
                  >
                    <span
                      style={{
                        borderBottom: `3px solid #0ea5e9`,
                        paddingBottom: 4,
                      }}
                    >
                      Favorite Virtual Outfits
                    </span>
                  </Title>
                  {favoriteTryon.length === 0 ? (
                    <Card
                      style={{
                        background: cardColor,
                        border: "none",
                        borderRadius: 22,
                        textAlign: "center",
                        padding: "3rem 1.5rem",
                        boxShadow: isDarkMode
                          ? "0 2px 16px #0006"
                          : "0 2px 16px #0ea5e933",
                      }}
                    >
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <Text style={{ color: subText, fontSize: "1.01rem" }}>
                            No favorite virtual outfits yet
                          </Text>
                        }
                      />
                    </Card>
                  ) : (
                    <Row gutter={[24, 24]}>
                      {favoriteTryon.map((item) => (
                        <Col xs={24} sm={12} key={item.id}>
                          <Card
                            hoverable
                            style={{
                              background: cardColor,
                              border:
                                "1.5px solid " +
                                (isDarkMode ? "#23272f" : "#e5e7eb"),
                              borderRadius: 22,
                              textAlign: "center",
                              boxShadow: isDarkMode
                                ? "0 2px 16px #0003"
                                : "0 2px 16px #0ea5e922",
                              marginBottom: 10,
                              position: "relative",
                              padding: "0.4rem 0.5rem 0 0.5rem",
                              overflow: "hidden",
                              minHeight: 340,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              transition: "box-shadow 0.2s, border 0.2s",
                            }}
                            bodyStyle={{ padding: "2rem 2rem" }}
                            cover={
                              <div
                                style={{
                                  position: "relative",
                                  background: isDarkMode
                                    ? "#18181b"
                                    : "#f3f4f6",
                                  borderTopLeftRadius: 22,
                                  borderTopRightRadius: 22,
                                  padding: 12,
                                }}
                              >
                                <img
                                  src={item.resultImage}
                                  alt="Favorite Try-On"
                                  style={{
                                    borderRadius: 14,
                                    maxHeight: 180,
                                    minHeight: 120,
                                    objectFit: "cover",
                                    margin: "auto",
                                    width: "100%",
                                    background: isDarkMode ? "#23272f" : "#fff",
                                    border: isDarkMode
                                      ? "1px solid #23272f"
                                      : "1px solid #e5e7eb",
                                    boxShadow: "none",
                                    display: "block",
                                  }}
                                />
                                <HeartFilled
                                  onClick={() => removeTryonFavorite(item.id)}
                                  style={{
                                    position: "absolute",
                                    top: 14,
                                    right: 14,
                                    fontSize: 22,
                                    color: isDarkMode ? "#fbbf24" : "#f59e42",
                                    backgroundColor: isDarkMode
                                      ? "#23272f"
                                      : "#fff",
                                    border: isDarkMode
                                      ? "1.5px solid #333"
                                      : "1.5px solid #e5e7eb",
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    boxShadow: "none",
                                    zIndex: 10,
                                    padding: 4,
                                    transition: "background 0.2s",
                                  }}
                                  title="Remove from favorites"
                                />
                              </div>
                            }
                          >
                            <div
                              style={{
                                minHeight: 30,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Text
                                style={{
                                  color: isDarkMode ? "#fff" : "#111",
                                  fontWeight: 700,
                                  fontSize: 20,
                                  marginBottom: 2,
                                }}
                              >
                                Outfit Image Generation
                              </Text>
                              <Text
                                style={{
                                  color: isDarkMode ? "#fff" : "#222",
                                  fontSize: 16,
                                  fontWeight: 600,
                                  marginBottom: 2,
                                }}
                              >
                                {item.timestamp}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* Features Section */}
          <div className="mt-20">
            <Title
              level={2}
              style={{
                color: textColor,
                textAlign: "center",
                marginTop: 20,
                marginBottom: 44,
                fontWeight: 700,
                fontSize: "1.35rem",
                letterSpacing: 0.5,
              }}
            >
              <span
                style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}
              >
                Why Save Favorites?
              </span>
            </Title>
            <Row gutter={[40, 40]}>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 22,
                    textAlign: "center",
                    boxShadow: isDarkMode
                      ? "0 2px 16px #0006"
                      : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: "1.8rem" }}>
                    💾
                  </div>
                  <Title
                    level={4}
                    style={{
                      color: textColor,
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    Quick Access
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Instantly access your favorite looks and combinations
                  </Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 22,
                    textAlign: "center",
                    boxShadow: isDarkMode
                      ? "0 2px 16px #0006"
                      : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: "1.8rem" }}>
                    🔄
                  </div>
                  <Title
                    level={4}
                    style={{
                      color: textColor,
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    Easy Recreation
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Recreate your favorite outfits with just one click
                  </Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 22,
                    textAlign: "center",
                    boxShadow: isDarkMode
                      ? "0 2px 16px #0006"
                      : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: "1.8rem" }}>
                    📈
                  </div>
                  <Title
                    level={4}
                    style={{
                      color: textColor,
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    Style Tracking
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Track your style evolution and preferences over time
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default FavoritesPage;
