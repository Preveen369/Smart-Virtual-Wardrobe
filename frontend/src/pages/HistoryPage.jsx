import React, { useState, useEffect } from "react";
import { Layout, Typography, Card, Row, Col, Button, Empty, Tag, Divider, Spin } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { tryOnService } from "../services/api";

const { Content } = Layout;
const { Title, Text } = Typography;

const HistoryPage = ({ isDarkMode }) => {
  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  // Load try-on history from backend
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch try-on sessions from the backend
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await tryOnService.getSessions();
        // Convert backend data to match the existing format
        const formattedSessions = data.map(session => ({
          id: session.id,
          resultImage: session.result_image_url,
          text: session.result_text,
          timestamp: new Date(session.created_at).toLocaleString(),
          completed_at: session.completed_at
        })).filter(session => session.resultImage); // Only show completed sessions
        
        setHistory(formattedSessions);
      } catch (error) {
        console.error("Failed to fetch try-on sessions:", error);
        toast.error("Failed to load try-on history");
        // Fallback to localStorage if backend fails
        const stored = JSON.parse(localStorage.getItem('tryon_history') || '[]');
        setHistory(stored);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) return (
    <div style={{ color: textColor, textAlign: "center", marginTop: 80 }}>
      <Spin size="large" />
      <div style={{ marginTop: 16 }}>Loading try-on history...</div>
    </div>
  );

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2rem 2.5rem" }}>
        <div className="max-w-6xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
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
                lineHeight: 1.1
              }}
            >
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>Try-On History</span>
            </Title>
            <Text
              style={{
                color: subText,
                fontSize: "1.18rem",
                display: "block",
                marginBottom: 30,
                fontWeight: 500
              }}
            >
              Track your virtual try-on experiments and style discoveries
            </Text>
          </div>

          {/* Filter Section */}

          {/* Previous Results Section */}
          <div className="mb-16 mt-14">
            <Title
              level={2}
              style={{ color: textColor, marginBottom: 36, marginTop: 0, fontWeight: 700, fontSize: '1.45rem', letterSpacing: 0.5 }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Previous Try-On Results</span>
            </Title>
            {history.length === 0 ? (
              <Card
                style={{
                  background: cardColor,
                  border: "none",
                  borderRadius: 20,
                  textAlign: "center",
                  padding: "4.5rem 2.5rem",
                  marginLeft: 40,
                  marginRight: 40,
                  boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933"
                }}
              >
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text style={{ color: textColor, fontSize: "1.13rem", display: "block", marginBottom: 8, fontWeight: 600 }}>
                        No try-on history yet
                      </Text>
                      <Text style={{ color: subText, fontSize: '1.01rem' }}>
                        Start by trying on some clothes to see your history here
                      </Text>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    size="large"
                    icon={<ClockCircleOutlined />}
                    href="/tryon"
                    style={{
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '1.01rem',
                      padding: '0.7rem 2.1rem',
                      background: 'linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)',
                      boxShadow: '0 2px 12px #0ea5e955',
                      border: 'none',
                      marginTop: 18
                    }}
                  >
                    Start Your First Try-On
                  </Button>
                </Empty>
              </Card>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '32px',
                  justifyContent: 'flex-start',
                  marginBottom: 48
                }}>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        background: cardColor,
                        padding: 16,
                        borderRadius: 16,
                        minHeight: 180,
                        maxWidth: 220,
                        width: 200,
                        height: 240,
                        margin: '0',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                        transition: 'box-shadow 0.2s',
                      }}
                    >
                      <img
                        src={item.resultImage}
                        alt="Previous Try-On"
                        style={{
                          width: "84%",
                          maxWidth: 160,
                          height: 160,
                          objectFit: 'cover',
                          borderRadius: 10,
                          margin: "0 auto 10px auto",
                          boxShadow: '0 2px 10px #0ea5e933',
                        }}
                      />
                      <Text
                        style={{
                          color: isDarkMode ? "#a3a3a3" : "#666",
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        {item.timestamp}
                      </Text>
                    </div>
                  ))}
                </div>
                <Divider />
                <div style={{ textAlign: 'right', marginTop: 12 }}>
                  <Button
                    danger
                    style={{
                      borderRadius: 999,
                      fontWeight: 700,
                      fontSize: '1.01rem',
                      padding: '0.6rem 1.7rem',
                      boxShadow: isDarkMode ? "0 2px 12px #0006" : "0 2px 12px #0ea5e955",
                      border: 'none',
                    }}
                    onClick={async () => {
                      // Clear localStorage history as fallback
                      localStorage.removeItem('tryon_history');
                      
                      // Try to clear backend history
                      try {
                        const sessions = await tryOnService.getSessions();
                        // Delete all sessions (in a real app, you might want a bulk delete endpoint)
                        for (const session of sessions) {
                          if (session.result_image_url) { // Only delete completed sessions
                            await tryOnService.deleteSession(session.id);
                          }
                        }
                        setHistory([]);
                        toast.success("History cleared successfully");
                      } catch (error) {
                        console.error("Failed to clear backend history:", error);
                        // If backend fails, just clear local state
                        setHistory([]);
                        toast.warn("Cleared local history. Some items may remain on server.");
                      }
                    }}
                  >
                    Clear History
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Features Section */}
          <div className="mt-20 mb-14">
            <Title
              level={2}
              style={{
                color: textColor,
                textAlign: "center",
                marginBottom: 44,
                marginTop: 44,
                fontWeight: 700,
                fontSize: '1.35rem',
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>History Features</span>
            </Title>
            <Row gutter={[40, 40]}>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>📈</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Progress Tracking
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Monitor your style evolution and try-on patterns
                  </Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>🔄</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Recreate Looks
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Easily recreate your previous successful combinations
                  </Text>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 160,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>📊</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Analytics
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Get insights into your style preferences and trends
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

export default HistoryPage; 