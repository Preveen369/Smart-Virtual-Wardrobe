import React, { useState, useEffect } from "react";
import { favoritesService, styleFeedService } from "../services/api";
import { Layout, ConfigProvider, theme, Button, Typography, Spin, Row, Col, Card, Select, Input, Empty } from "antd";
import { CloseCircleOutlined, HeartOutlined, HeartFilled } from "@ant-design/icons"; 

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function StyleFeedPage({ isDarkMode }) {
  const [filterOptions, setFilterOptions] = useState({
    genders: [],
    subcategories: [],
    articleTypes: [],
    seasons: [],
    styles: [],
    colors: [],
  });

  const [selectedFilters, setSelectedFilters] = useState({
    gender: "all",
    subcategory: "all",
    articleType: "all",
    season: "all",
    style: "all",
    color: "all",
  });

  const [customPrompt, setCustomPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState(null);
  const [isFirstGeneration, setIsFirstGeneration] = useState(true);
  const [pendingImage, setPendingImage] = useState(null);
  const [feedFavorites, setFeedFavorites] = useState([]);

  const { defaultAlgorithm, darkAlgorithm } = theme;

  // Load filter options on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/apparel/filters");
        if (res.ok) {
          const data = await res.json();
          setFilterOptions(data);
        }
      } catch (err) {
        console.error("Error loading filter options:", err);
      }
    };
    loadFilters();
  }, []);

  // Build prompt and call backend /image/{prompt} using fetch
  const generateImage = async () => {
    setError(null);

    // On second click, if pending image exists, just display it
    if (!isFirstGeneration && pendingImage) {
      setFeed((p) => [pendingImage, ...p]);
      setPendingImage(null);
      return;
    }

    setLoading(true);

    try {
      // Fetch filtered products
      const queryParams = new URLSearchParams();
      if (selectedFilters.gender !== "all") queryParams.append("gender", selectedFilters.gender);
      if (selectedFilters.subcategory !== "all") queryParams.append("subcategory", selectedFilters.subcategory);
      if (selectedFilters.articleType !== "all") queryParams.append("article_type", selectedFilters.articleType);
      if (selectedFilters.season !== "all") queryParams.append("season", selectedFilters.season);
      if (selectedFilters.style !== "all") queryParams.append("style", selectedFilters.style);
      if (selectedFilters.color !== "all") queryParams.append("color", selectedFilters.color);

      const productsRes = await fetch(`http://localhost:8000/api/apparel/products?${queryParams}`);
      if (!productsRes.ok) {
        throw new Error("Failed to fetch products");
      }

      const productsData = await productsRes.json();
      const products = productsData.products || [];

      // Build prompt from selected filters and products
      let promptParts = [];
      
      if (selectedFilters.gender !== "all") {
        promptParts.push(selectedFilters.gender);
      }
      if (selectedFilters.subcategory !== "all") {
        promptParts.push(selectedFilters.subcategory);
      }
      if (selectedFilters.articleType !== "all") {
        promptParts.push(selectedFilters.articleType);
      }
      if (selectedFilters.season !== "all") {
        promptParts.push(selectedFilters.season);
      }
      if (selectedFilters.style !== "all") {
        promptParts.push(selectedFilters.style);
      }
      if (selectedFilters.color !== "all") {
        promptParts.push(selectedFilters.color);
      }

      if (products.length > 0) {
        const productNames = products.map(p => p.productDisplayName).join(", ");
        promptParts.push(`wearing ${productNames}`);
      }

      if (customPrompt.trim()) {
        promptParts.push(customPrompt.trim());
      }

      const basePrompt = promptParts.join(" ") || "fashion outfit";
      const finalPrompt = `${basePrompt} fashion editorial outfit, high-quality and detailed, on a model with professional studio lighting`;
      const model = "flux";
      // note: backend router is mounted under /api prefix
      const endpoint = `http://localhost:8000/api/image/${encodeURIComponent(finalPrompt)}?model=${encodeURIComponent(model)}`;

      const res = await fetch(endpoint);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Image API error ${res.status}: ${txt}`);
      }

      const data = await res.json();
      const imageUrl = data?.image_url || data?.imageUrl || data?.url || endpoint;
      const modelUsed = data?.model || model;

      const newItem = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        filters: selectedFilters,
        customPrompt: customPrompt,
        prompt: finalPrompt,
        url: imageUrl,
        model: modelUsed,
        timestamp: new Date().toLocaleString(),
      };

      // If first generation, store as pending; don't add to feed yet
      if (isFirstGeneration) {
        setPendingImage(newItem);
        setIsFirstGeneration(false);
      } else {
        // On third+ clicks, add the new image to feed
        setFeed((p) => [newItem, ...p]);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    // Reset the cycle when options change
    setIsFirstGeneration(true);
    setPendingImage(null);
  };

  const clearFeed = () => {
    // keep existing cards; just reset the filter inputs and any error message
    setSelectedFilters({
      gender: "all",
      subcategory: "all",
      articleType: "all",
      season: "all",
      style: "all",
      color: "all",
    });
    setCustomPrompt("");
    setError(null);
    // also reset generation state so a new prompt cycle begins
    setIsFirstGeneration(true);
    setPendingImage(null);
  };

  const deleteItem = (itemId) => {
    setFeed((prev) => prev.filter((item) => item.id !== itemId));
  };

  // favorites for the style feed

  // load the saved cards from the style_feed collection and also build the
  // favorites array used by the toggle logic.  We call this on mount so the
  // page initially shows previously favorited/generated cards instead of being
  // empty.
  const loadSavedFeed = async () => {
    try {
      const entries = await styleFeedService.list();
      // cards themselves; ensure `filters` object exists to avoid UI crashes
      const cards = entries.map((e) => {
        const card = { ...e.card };
        // historical favorites stored the generated image under `resultImage`.
        // modern entries may already have `url`; in either case we want a
        // canonical `url` property used by the renderer.
        card.url = card.url || card.resultImage || card.imageUrl || "";

        if (!card.filters) {
          card.filters = {
            gender: "all",
            subcategory: "all",
            articleType: "all",
            season: "all",
            style: "all",
            color: "all",
          };
        }
        return card;
      });
      setFeed(cards);

      // favorites metadata for toggling
      const favs = entries.map((e) => ({
        id: e.favorite_id,
        type: 'stylefeed',
        item: { ...e.card, filters: e.card.filters || {} },
        created_at: e.created_at,
        updated_at: e.created_at,
      }));
      setFeedFavorites(favs);
    } catch (err) {
      console.error('failed to load style feed from db', err);
    }
  };

  useEffect(() => {
    loadSavedFeed();
  }, []);

  const isFavorite = (item) => {
    return feedFavorites.some((f) => f.item.id === item.id);
  };

  const toggleFavorite = async (item) => {
    try {
      if (isFavorite(item)) {
        const rec = feedFavorites.find((f) => f.item.id === item.id);
        if (rec) {
          await favoritesService.delete(rec.id);
          setFeedFavorites((prev) => prev.filter((f) => f.id !== rec.id));
          // also remove from the visible feed since the style-feed page only shows
          // saved cards
          setFeed((prev) => prev.filter((c) => c.id !== item.id));
        }
      } else {
        const favObj = {
          id: item.id,
          resultImage: item.url,
          text: item.prompt || item.customPrompt || "",
          timestamp: item.timestamp,
        };
        const created = await favoritesService.create('stylefeed', favObj);
        setFeedFavorites((prev) => [created, ...prev]);
        // ensure newly favorited/saved card appears in feed if it wasn't there
        if (!feed.some((c) => c.id === item.id)) {
          setFeed((prev) => [item, ...prev]);
        }
      }
    } catch (err) {
      console.error('toggle favorite error', err);
    }
  }; 

  const bg = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardBg = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";
  const borderColor = isDarkMode ? "#27272a" : "#e5e7eb";

  const createSelectField = (label, filterName, options) => {
    const selectOptions = [{ label: "All", value: "all" }, ...options.map((opt) => ({ label: opt, value: opt }))];
    return (
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600, color: subText }}>
          {label}
        </label>
        <Select
          value={selectedFilters[filterName]}
          onChange={(val) => handleFilterChange(filterName, val ?? "all")}
          disabled={loading}
          options={selectOptions}
          style={{
            width: "100%",
            marginTop: 6,
            borderRadius: 8,
            background: isDarkMode ? "#27272a" : "#f3f4f6",
            color: textColor,
            fontSize: "1rem",
            fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          dropdownMatchSelectWidth={false}
          placeholder="All"
        />
      </div>
    );
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: { colorPrimary: "#0ea5e9", borderRadius: 10 },
      }}
    >
      <Layout style={{ minHeight: "100vh", background: bg }}>
        <Header style={{ background: "transparent", padding: "0", height: "auto" }} />
        <Content style={{ padding: "2rem 2.5rem" }}>
          <div className="max-w-7xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
            {/* Header Section */}
            <div className="text-center mb-12" style={{ marginBottom: 48 }}>
              <Title
                level={1}
                style={{
                  color: textColor,
                  margin: "24px 0 16px 0",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  letterSpacing: 0.8,
                  lineHeight: 1.1,
                }}
              >
                <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>
                  Style Feed
                </span>
              </Title>
              <Text
                style={{
                  color: subText,
                  fontSize: "1.1rem",
                  display: "block",
                  fontWeight: 500,
                  marginTop: 12,
                }}
              >
                Discover AI-generated fashion inspiration. Select filters and generate editorial outfit ideas powered by your wardrobe.
              </Text>
            </div>

            {/* Controls Section */}
            <Card
              style={{
                background: cardBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 20,
                padding: "32px",
                marginBottom: 32,
                boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
              }}
              bodyStyle={{ padding: 0 }}
            >
              <Row gutter={[16, 16]}>
                {/* Gender Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Gender", "gender", filterOptions.genders)}
                </Col>

                {/* Subcategory Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Category", "subcategory", filterOptions.subcategories)}
                </Col>

                {/* Article Type Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Type", "articleType", filterOptions.articleTypes)}
                </Col>

                {/* Season Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Season", "season", filterOptions.seasons)}
                </Col>

                {/* Style Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Style", "style", filterOptions.styles)}
                </Col>

                {/* Color Filter */}
                <Col xs={24} sm={12} md={6}>
                  {createSelectField("Color", "color", filterOptions.colors)}
                </Col>

                {/* Custom Prompt Input */}
                <Col xs={24} sm={12} md={6}>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: "block", marginBottom: 6, fontSize: "0.85rem", fontWeight: 600, color: subText }}>
                      Additional Details
                    </label>
                    <Input.TextArea
                      placeholder="Scenario, surroundings, mood..."
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value);
                        setIsFirstGeneration(true);
                        setPendingImage(null);
                      }}
                      disabled={loading}
                      rows={2}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: `1px solid ${borderColor}`,
                        background: isDarkMode ? "#27272a" : "#f3f4f6",
                        color: textColor,
                        fontSize: "1.0rem",
                        fontFamily: "inherit",
                        resize: "vertical",
                        padding: "8px 10px",
                        minHeight: "44px",
                        cursor: loading ? "not-allowed" : "text"
                      }}
                    />
                  </div>
                </Col>

                {/* Action Buttons */}
                <Col xs={24} style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
                  <Button
                    type="primary"
                    size="large"
                    onClick={generateImage}
                    loading={loading}
                    style={{
                      height: 48,
                      minWidth: 200,
                      fontSize: 16,
                      borderRadius: 999,
                      fontWeight: 700,
                      background: "linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)",
                      boxShadow: "0 2px 12px #0ea5e955",
                      letterSpacing: 0.5,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 10,
                      padding: "0 1.25rem",
                    }}
                  >
                    {loading ? (
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Generating…</span>
                    ) : (
                      <>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Generate Image</span>
                        <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </>
                    )}
                  </Button>

                  <Button
                    size="large"
                    onClick={clearFeed}
                    disabled={loading || feed.length === 0}
                    style={{
                      height: 48,
                      minWidth: 160,
                      borderRadius: 999,
                      fontSize: 16,
                      fontWeight: 700,
                      color: subText,
                      border: `1px solid ${borderColor}`,
                      background: isDarkMode ? "rgba(255,255,255,0.02)" : "transparent",
                      boxShadow: "none",
                      padding: '0 1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    Clear Filters
                  </Button>
                </Col>
              </Row>
            </Card>

            {/* Error Message */}
            {error && (
              <Card
                style={{
                  background: "#fee2e2",
                  border: "1px solid #fca5a5",
                  borderRadius: 12,
                  padding: "16px",
                  marginBottom: 24,
                  boxShadow: "0 2px 8px #fca5a522",
                }}
                bodyStyle={{ padding: 0 }}
              >
                <Text style={{ color: "#7f1d1d", fontWeight: 500, fontSize: "0.95rem" }}>
                  ⚠️ {error}
                </Text>
              </Card>
            )}

            {/* Feed Grid */}
            <div style={{ position: "relative" }}>
              {/* Loading Overlay */}
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 30,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDarkMode ? "rgba(15, 15, 15, 0.7)" : "rgba(249, 250, 251, 0.7)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 20,
                  }}
                >
                  <Spin size="large" tip="Generating inspiration..." />
                </div>
              )} 

              {/* Empty State */}
              {feed.length === 0 && (
                <Card
                  style={{
                    background: cardBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: 20,
                    textAlign: "center",
                    padding: "4.5rem 2.5rem",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                  }}
                  bodyStyle={{ padding: 0 }}
                >
                  <Empty
                    description={<span style={{ color: textColor, fontSize: '1.13rem', fontWeight: 700 }}>No inspiration yet</span>}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Text style={{ color: subText, fontSize: '1rem' }}>
                      Select filters above and click "Generate Image" to create AI-powered fashion concepts from your wardrobe.
                    </Text>
                  </div>
                </Card>
              )}

              {/* Masonry Grid */}
              {feed.length > 0 && (
                <Row gutter={[20, 20]}>
                  {feed.map((item) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                      <Card
                        hoverable
                        style={{
                          background: cardBg,
                          border: `1px solid ${borderColor}`,
                          borderRadius: 20,
                          overflow: "hidden",
                          boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                          transition: "all 0.3s",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                        }}
                        bodyStyle={{ padding: "0 16px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}
                        cover={
                          <div
                            style={{
                              height: 240,
                              overflow: "hidden",
                              background: isDarkMode ? "#27272a" : "#f3f4f6",
                              position: "relative",
                            }}
                          >
                            <img
                              src={item.url}
                              alt="Generated outfit"
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />
                            <div
                              style={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                display: "flex",
                                flexDirection: "column",
                                gap: 8,
                                alignItems: "center",
                                zIndex: 20,
                              }}
                            >
  
                              {isFavorite(item) ? (
                                <HeartFilled
                                  onClick={() => toggleFavorite(item)}
                                  style={{
                                    fontSize: 20,
                                    color: isDarkMode ? '#fbbf24' : '#f59e42',
                                    backgroundColor: isDarkMode ? '#23272f' : '#fff',
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                                    padding: 4,
                                    zIndex: 10,
                                    transition: 'background 0.2s',
                                  }}
                                  title="Remove from favorites"
                                />
                              ) : (
                                <HeartOutlined
                                  onClick={() => toggleFavorite(item)}
                                  style={{
                                    fontSize: 20,
                                    color: isDarkMode ? '#fbbf24' : '#f59e42',
                                    backgroundColor: isDarkMode ? '#23272f' : '#fff',
                                    borderRadius: "50%",
                                    cursor: "pointer",
                                    boxShadow: isDarkMode ? "0 2px 6px #23272f" : "0 2px 6px #e5e7eb",
                                    padding: 4,
                                    zIndex: 10,
                                    transition: 'background 0.2s',
                                  }}
                                  title="Add to favorites"
                                />
                              )}
                            </div>
                          </div>
                        }
                      >
                        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <div style={{ marginBottom: 12 }}>
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginTop: 6,
                              }}
                            >
                              {item.filters?.gender && item.filters.gender !== "all" && (
                                <span
                                  style={{
                                    background: "#0ea5e922",
                                    color: "#0ea5e9",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.filters.gender}
                                </span>
                              )}
                              {item.filters?.season && item.filters.season !== "all" && (
                                <span
                                  style={{
                                    background: "#ec407a22",
                                    color: "#ec407a",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.filters.season}
                                </span>
                              )}
                              {item.filters?.style && item.filters.style !== "all" && (
                                <span
                                  style={{
                                    background: "#66bb6a22",
                                    color: "#66bb6a",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.filters.style}
                                </span>
                              )}
                              {item.filters?.color && item.filters.color !== "all" && (
                                <span
                                  style={{
                                    background: "#ffa72622",
                                    color: "#ffa726",
                                    padding: "6px 10px",
                                    borderRadius: 999,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {item.filters.color}
                                </span>
                              )}
                            </div>
                          </div>

                          <Text
                            style={{
                              color: subText,
                              fontSize: "0.8rem",
                              marginBottom: 12,
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

            {/* Stats Footer */}
            {feed.length > 0 && (
              <div
                style={{
                  marginTop: 40,
                  padding: "20px",
                  borderTop: `1px solid ${borderColor}`,
                  textAlign: "center",
                }}
              >
                <Text style={{ color: subText, fontSize: "0.9rem" }}>
                  💡 Total generated: <span style={{ color: textColor, fontWeight: 600 }}>{feed.length}</span> inspiration{" "}
                  {feed.length === 1 ? "image" : "images"}
                </Text>
              </div>
            )}
          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
