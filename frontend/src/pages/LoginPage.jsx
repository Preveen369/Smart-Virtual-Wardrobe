import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Layout, Typography, Card, Form, Input, Button, Alert, Divider, Row, Col } from "antd";
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";

const { Content } = Layout;
const { Title, Text } = Typography;

const LoginPage = ({ isDarkMode }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  const handleSubmit = async (values) => {
    setLoading(true);
    setError("");
    try {
      const result = await login(values.email, values.password);
      if (!result.success) {
        setError(result.message || "Invalid email or password. Please try again.");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2.5rem 2.5rem" }}>
        <div className="max-w-lg mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16 mt-12">
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
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>Welcome Back</span>
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
              Sign in to your Smart Virtual Wardrobe account
            </Text>
          </div>

          {/* Login Form */}
          <Card
            style={{
              background: cardColor,
              border: "none",
              borderRadius: 20,
              boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
              minHeight: 320,
              marginBottom: 18
            }}
            bodyStyle={{ padding: "2.2rem 1.5rem" }}
          >
            {error && (
              <Alert
                message={error}
                type="error"
                showIcon
                style={{ marginBottom: 24 }}
              />
            )}

            <Form
              name="login"
              onFinish={handleSubmit}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label={<Text style={{ color: textColor }}>Email</Text>}
                rules={[
                  { required: true, message: "Please enter your email!" },
                  { type: "email", message: "Please enter a valid email!" }
                ]}
              >
                <Input
                  prefix={<MailOutlined style={{ color: subText }} />}
                  placeholder="Enter your email"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={<Text style={{ color: textColor }}>Password</Text>}
                rules={[
                  { required: true, message: "Please enter your password!" },
                  { min: 6, message: "Password must be at least 6 characters!" }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: subText }} />}
                  placeholder="Enter your password"
                  iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  style={{ borderRadius: 8, fontWeight: 700, fontSize: "1.08rem", padding: "0.7rem 2.1rem", background: "linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)", boxShadow: "0 2px 12px #0ea5e955", border: "none" }}
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ margin: "24px 0" }}>
              <Text style={{ color: subText }}>Don't have an account?</Text>
            </Divider>

            <div className="text-center">
              <Link to="/register">
                <Button size="large" style={{ borderRadius: 8 }}>
                  Create Account
                </Button>
              </Link>
            </div>
          </Card>

          {/* Benefits Section */}
          <div className="mt-14 mb-10">
            <Title
              level={3}
              style={{
                color: textColor,
                marginBottom: 22,
                marginTop: 50,
                textAlign: "center",
                fontWeight: 700,
                fontSize: "1.35rem",
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Why use Smart Virtual Wardrobe?</span>
            </Title>
            <Row gutter={[32, 32]} justify="center">
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                  bodyStyle={{ padding: "1.5rem 1rem" }}
                >
                  <div className="text-4xl mb-3" style={{ fontSize: '1.8rem' }}>👗</div>
                  <Text style={{ color: subText, fontSize: "1.08rem" }}>Virtual try-on for clothes</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                  bodyStyle={{ padding: "1.5rem 1rem" }}
                >
                  <div className="text-4xl mb-3" style={{ fontSize: '1.8rem' }}>👕</div>
                  <Text style={{ color: subText, fontSize: "1.08rem" }}>Personal digital wardrobe</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                  bodyStyle={{ padding: "1.5rem 1rem" }}
                >
                  <div className="text-4xl mb-3" style={{ fontSize: '1.8rem' }}>❤️</div>
                  <Text style={{ color: subText, fontSize: "1.08rem" }}>Save favorite combinations</Text>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 20,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                    minHeight: 120,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                  bodyStyle={{ padding: "1.5rem 1rem" }}
                >
                  <div className="text-4xl mb-3" style={{ fontSize: '1.8rem' }}>📈</div>
                  <Text style={{ color: subText, fontSize: "1.08rem" }}>Style history and analytics</Text>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default LoginPage;