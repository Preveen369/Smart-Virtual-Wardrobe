import React from "react";
import { Layout, Typography, Card, Row, Col, Button, Collapse, List, Tag } from "antd";
import { QuestionCircleOutlined, MessageOutlined, BookOutlined, VideoCameraOutlined, MailOutlined, PhoneOutlined } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

const HelpPage = ({ isDarkMode }) => {
  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  const faqData = [
    {
      question: "How does virtual try-on work?",
      answer: "Our AI-powered system analyzes your photo and the clothing item, then generates a realistic image of you wearing that garment while preserving your face and background."
    },
    {
      question: "What image formats are supported?",
      answer: "We support JPEG, PNG, WebP, HEIC, and HEIF formats. Images should be clear and well-lit for best results."
    },
    {
      question: "How long does it take to generate a try-on?",
      answer: "Typically, it takes 10-30 seconds to generate a virtual try-on image, depending on the complexity and server load."
    },
    {
      question: "Can I save my favorite looks?",
      answer: "Yes! You can save your favorite try-on results to your favorites section for easy access later."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We prioritize your privacy and security. Images are processed securely and not stored permanently without your consent."
    },
    {
      question: "What if the result doesn't look good?",
      answer: "Try adjusting the lighting in your photo, ensuring the clothing item is clearly visible, or try different angles for better results."
    }
  ];

  const contactMethods = [
    {
      icon: <MailOutlined />,
      title: "Email Support",
      description: "Get help via email",
      action: "support@virtualwardrobe.com"
    },
    {
      icon: <MessageOutlined />,
      title: "Live Chat",
      description: "Chat with our support team",
      action: "Available 24/7"
    },
    {
      icon: <PhoneOutlined />,
      title: "Phone Support",
      description: "Call us directly",
      action: "+1 (555) 123-4567"
    }
  ];

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2rem 2.5rem" }}>
        <div className="max-w-6xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
          {/* Header Section */}
          <div className="text-center mb-16">
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
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>Help & Support</span>
            </Title>
            <Text
              style={{
                color: subText,
                fontSize: "1.25rem",
                display: "block",
                marginBottom: 32
              }}
            >
              Find answers, tips, and get the support you need for your Smart Virtual Wardrobe experience.
            </Text>
          </div>



          {/* FAQ Section */}
          <div className="mb-16">
            <Title
              level={2}
              style={{
                color: textColor,
                marginBottom: 32,
                marginTop: 56,
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Frequently Asked Questions</span>
            </Title>
            <Card
              style={{
                background: cardColor,
                border: "none",
                borderRadius: 20,
                boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                padding: 8
              }}
            >
              <Collapse ghost expandIconPosition="end">
                {faqData.map((faq, index) => (
                  <Panel
                    header={
                      <Text style={{ color: textColor, fontSize: "1.1rem", fontWeight: 600 }}>
                        {faq.question}
                      </Text>
                    }
                    key={index}
                    style={{ marginBottom: 12 }}
                  >
                    <Paragraph style={{ color: subText, marginBottom: 0, fontSize: "1rem" }}>
                      {faq.answer}
                    </Paragraph>
                  </Panel>
                ))}
              </Collapse>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="mb-16">
            <Title
              level={2}
              style={{
                color: textColor,
                marginBottom: 32,
                marginTop: 56,
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Contact Support</span>
            </Title>
            <Row gutter={[40, 40]}>
              {contactMethods.map((method, index) => (
                <Col xs={24} md={8} key={index}>
                  <Card
                    hoverable
                    style={{
                      background: cardColor,
                      border: "none",
                      borderRadius: 16,
                      textAlign: "center",
                      boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                      minHeight: 220,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center"
                    }}
                  >
                    <div style={{ fontSize: 36, color: "#0ea5e9", marginBottom: 16 }}>
                      {method.icon}
                    </div>
                    <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                      {method.title}
                    </Title>
                    <Text style={{ color: subText, display: "block", marginBottom: 14, fontSize: "1rem" }}>
                      {method.description}
                    </Text>
                    <Button type="primary" size="large" style={{ borderRadius: 8, fontWeight: 500, fontSize: "1rem" }}>
                      {method.action}
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>

          {/* Tips Section */}
          <div>
            <Title
              level={2}
              style={{
                color: textColor,
                marginBottom: 32,
                marginTop: 56,
                fontSize: "2rem",
                fontWeight: 700,
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Tips for Better Results</span>
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
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>📸</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Good Lighting
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Use well-lit photos with clear visibility of your face and body
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
                  <div className="text-4xl mb-4" style={{ fontSize: '1.8rem' }}>👕</div>
                  <Title level={4} style={{ color: textColor, marginBottom: 10, fontWeight: 600 }}>
                    Clear Clothing
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Ensure the clothing item is clearly visible without obstructions
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
                    Proper Angles
                  </Title>
                  <Text style={{ color: subText, fontSize: "1rem" }}>
                    Use front-facing photos for the most accurate results
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

export default HelpPage; 