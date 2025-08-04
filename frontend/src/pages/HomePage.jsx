import React from "react";
import { Link } from "react-router-dom";
import { Layout, Typography, Card, Row, Col } from "antd";

const { Content } = Layout;
const { Title, Text } = Typography;

const HomePage = ({ isDarkMode }) => {
  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  const features = [
    {
      title: "Virtual Try-On",
      description: "Try clothes virtually with AI-powered image generation",
      path: "/tryon",
      color: "bg-blue-600 hover:bg-blue-700",
      icon: "👗"
    },
    {
      title: "My Wardrobe",
      description: "Manage and organize your digital clothing collection",
      path: "/wardrobe",
      color: "bg-green-600 hover:bg-green-700",
      icon: "👕"
    },
    {
      title: "Favorites",
      description: "Save and access your favorite outfits and styles",
      path: "/favorites",
      color: "bg-pink-600 hover:bg-pink-700",
      icon: "❤️"
    },
    {
      title: "History",
      description: "View your past try-ons and fashion experiments",
      path: "/history",
      color: "bg-gray-600 hover:bg-gray-700",
      icon: "📅"
    },
    {
      title: "Profile",
      description: "Manage your account and personal preferences",
      path: "/profile",
      color: "bg-yellow-500 hover:bg-yellow-600",
      icon: "👤"
    },
    {
      title: "Help & FAQ",
      description: "Get support and answers to your questions",
      path: "/help",
      color: "bg-indigo-600 hover:bg-indigo-700",
      icon: "❓"
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2.5rem 2.5rem" }}>
        <div className="max-w-6xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
          {/* Header Section */}
          <div className="text-center mb-20">
            <Title
              level={1}
              style={{
                color: textColor,
                marginTop: 32,
                marginBottom: 18,
                fontSize: "3.2rem",
                fontWeight: 800,
                letterSpacing: 1.5,
                lineHeight: 1.1
              }}
            >
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>Smart Virtual Wardrobe</span>
            </Title>
            <Text
              style={{
                color: subText,
                fontSize: "1.35rem",
                display: "block",
                marginBottom: 40,
                fontWeight: 500
              }}
            >
              Your AI-powered digital closet. Try on clothes virtually, manage your wardrobe, and discover your perfect style with ease!
            </Text>
          </div>

          {/* Features Grid */}
          <Row gutter={[40, 40]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <Card
                  hoverable
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    height: "100%",
                    transition: "box-shadow 0.2s"
                  }}
                  bodyStyle={{ padding: "2.2rem 1.5rem" }}
                >
                  <div className="text-center">
                    <div className="text-5xl mb-5" style={{ fontSize: '1.55rem', filter: "drop-shadow(0 2px 6px #0ea5e955)" }}>{feature.icon}</div>
                    <Title
                      level={3}
                      style={{
                        color: textColor,
                        marginBottom: 14,
                        fontSize: "1.6rem",
                        fontWeight: 700
                      }}
                    >
                      {feature.title}
                    </Title>
                    <Text
                      style={{
                        color: subText,
                        display: "block",
                        marginBottom: 28,
                        fontSize: "1.08rem"
                      }}
                    >
                      {feature.description}
                    </Text>
                    <Link
                      to={feature.path}
                      className={`${feature.color} text-white rounded-full font-bold transition-all duration-200 transform hover:scale-110 inline-block shadow-lg`}
                      style={{
                        textDecoration: "none",
                        fontSize: "0.93rem",
                        letterSpacing: 0.5,
                        boxShadow: "0 4px 16px #0ea5e955, 0 1.5px 6px #0002",
                        border: "2px solid #0ea5e9",
                        outline: "none",
                        background: `linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)`,
                        transition: "all 0.18s cubic-bezier(.4,2,.6,1)",
                        marginTop: 8,
                        padding: "0.48rem 1.15rem"
                      }}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontWeight: 700, fontSize: "0.93rem", letterSpacing: 0.5, color: '#fff', textShadow: '0 1.5px 8px #0ea5e9cc', padding: '0 1px' }}>Get Started</span>
                        <svg width="17" height="17" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                      </span>
                    </Link>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Quick Stats Section */}
          <div className="mt-24">
            <Title
              level={2}
              style={{
                color: textColor,
                textAlign: "center",
                marginBottom: 48,
                marginTop: 60,
                fontSize: "2.1rem",
                fontWeight: 700,
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Why Choose Smart Virtual Wardrobe?</span>
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
                    minHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>🚀</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    AI-Powered
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Advanced AI technology for realistic virtual try-ons
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
                    minHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>⚡</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Fast & Easy
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Get results in seconds with our streamlined process
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
                    minHeight: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center"
                  }}
                >
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>🎯</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Personalized
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Tailored experience based on your style preferences
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

export default HomePage; 