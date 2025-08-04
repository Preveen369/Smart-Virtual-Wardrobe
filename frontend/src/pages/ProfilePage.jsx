import React from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Typography, Card, Row, Col, Button, Avatar, Form, Input, Select, Divider, Badge, Spin } from "antd";
import { UserOutlined, SettingOutlined, BellOutlined, SecurityScanOutlined, HeartOutlined, HistoryOutlined, LogoutOutlined, HomeOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { message } from "antd";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authService, apiUtils } from "../services/api";

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const ProfilePage = ({ isDarkMode }) => {
  const { user, token, getProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();

  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const cardColor = isDarkMode ? "#1c1c1c" : "#ffffff";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";
  const subText = isDarkMode ? "#9ca3af" : "#4b5563";

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const result = await getProfile();
        if (result.success) {
          setProfile(result.data);
          form.setFieldsValue(result.data);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        const errorInfo = apiUtils.handleError(error);
        toast.error(errorInfo.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (token) {
      fetchProfile();
    }
  }, [token, getProfile, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const result = await updateProfile(values);
      if (result.success) {
        setProfile(result.data);
        toast.success("Profile updated successfully");
        setIsEditing(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      const errorInfo = apiUtils.handleError(error);
      toast.error(errorInfo.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.setFieldsValue(profile);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: "100vh", background: bgColor }}>
        <Content style={{ padding: "2.5rem 2.5rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh", background: bgColor }}>
      <Content style={{ padding: "2.5rem 2.5rem" }}>
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
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>My Profile</span>
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
              Manage your account settings and preferences
            </Text>
          </div>

          <Row gutter={[32, 32]}>
            {/* Profile Info Card */}
            <Col xs={24} lg={8}>
              <Card
                style={{
                  background: cardColor,
                  border: "none",
                  borderRadius: 20,
                  textAlign: "center",
                  boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                  padding: 0
                }}
              >
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 18, background: "linear-gradient(135deg, #0ea5e9 60%, #38bdf8 100%)", color: "#fff" }}
                />
                <Title level={3} style={{ color: textColor, marginBottom: 6, fontWeight: 700 }}>
                  {profile?.first_name || ""} {profile?.last_name || ""}
                </Title>
                <Text style={{ color: subText, display: "block", marginBottom: 18, fontSize: "1.05rem" }}>
                  {profile?.email}
                </Text>
                {/* Edit Profile Button */}
                {!isEditing && (
                  <Button
                    type="primary"
                    size="large"
                    block
                    style={{
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: "1.08rem",
                      marginTop: 15,
                      background: "linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)",
                      border: "none"
                    }}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Card>
            </Col>
            {/* Settings Section */}
            <Col xs={24} lg={16}>
              <Card
                style={{
                  background: cardColor,
                  border: "none",
                  borderRadius: 20,
                  boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
                  padding: 0
                }}
              >
                <Title level={3} style={{ color: textColor, marginBottom: 28, fontWeight: 700 }}>
                  <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Account Settings</span>
                </Title>
                <Form
                  layout="vertical"
                  form={form}
                  initialValues={profile}
                  onFinish={handleSave}
                  disabled={!isEditing}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item name="first_name" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>First Name</span>}>
                        <Input placeholder="Enter your first name" style={{ borderRadius: 8, fontSize: "1.05rem" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="last_name" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>Last Name</span>}>
                        <Input placeholder="Enter your last name" style={{ borderRadius: 8, fontSize: "1.05rem" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="email" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>Email</span>}>
                        <Input disabled style={{ borderRadius: 8, fontSize: "1.05rem" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="gender" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>Gender</span>}>
                        <Select placeholder="Select your gender" style={{ borderRadius: 8, fontSize: "1.05rem" }}>
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item name="age" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>Age</span>}>
                        <Input type="number" placeholder="Enter your age" style={{ borderRadius: 8, fontSize: "1.05rem" }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24}>
                      <Form.Item name="style_preferences" label={<span style={{ color: textColor, fontWeight: 600, fontSize: '1.13rem' }}>Style Preferences</span>}>
                        <Select mode="multiple" placeholder="Select your style preferences" style={{ borderRadius: 8, fontSize: "1.05rem" }}>
                          <Option value="casual">Casual</Option>
                          <Option value="formal">Formal</Option>
                          <Option value="business">Business</Option>
                          <Option value="sporty">Sporty</Option>
                          <Option value="elegant">Elegant</Option>
                          <Option value="bohemian">Bohemian</Option>
                          <Option value="vintage">Vintage</Option>
                          <Option value="modern">Modern</Option>
                          <Option value="traditional">Traditional</Option>
                          <Option value="streetwear">Streetwear</Option>
                          <Option value="minimalist">Minimalist</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider />
                  {isEditing && (
                    <div className="flex justify-end gap-3 mt-7">
                      <Button size="large" style={{ borderRadius: 8, fontWeight: 500 }} onClick={handleCancel}>Cancel</Button>
                      <Button type="primary" size="large" htmlType="submit" loading={saving} style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        marginLeft: 20,
                        background: "linear-gradient(90deg, #0ea5e9 60%, #38bdf8 100%)",
                        border: "none"
                      }}>
                        Save Changes
                      </Button>
                    </div>
                  )}
                </Form>
              </Card>
            </Col>
          </Row>
          {/* Quick Actions */}
          <div className="mt-16">
            <Title
              level={2}
              style={{
                color: textColor,
                marginBottom: 28,
                fontWeight: 800,
                marginTop: 40,
                fontSize: "2rem",
                letterSpacing: 0.5
              }}
            >
              <span style={{ borderBottom: `3px solid #0ea5e9`, paddingBottom: 4 }}>Quick Actions</span>
            </Title>
            <Row gutter={[24, 24]}>
              <Col xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/favorites')}
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 12px #0005" : "0 2px 12px #0ea5e922",
                    cursor: 'pointer'
                  }}
                >
                  <HeartOutlined style={{ fontSize: 28, color: "#0ea5e9", marginBottom: 10 }} />
                  <Text style={{ color: textColor, display: "block", fontWeight: 600, fontSize: "1.08rem" }}>
                    View Favorites
                  </Text>
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/history')}
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 12px #0005" : "0 2px 12px #0ea5e922",
                    cursor: 'pointer'
                  }}
                >
                  <HistoryOutlined style={{ fontSize: 28, color: "#0ea5e9", marginBottom: 10 }} />
                  <Text style={{ color: textColor, display: "block", fontWeight: 600, fontSize: "1.08rem" }}>
                    View History
                  </Text>
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  onClick={() => navigate('/')}
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 12px #0005" : "0 2px 12px #0ea5e922",
                    cursor: 'pointer'
                  }}
                >
                  <HomeOutlined style={{ fontSize: 28, color: "#0ea5e9", marginBottom: 10 }} />
                  <Text style={{ color: textColor, display: "block", fontWeight: 600, fontSize: "1.08rem" }}>
                    Home
                  </Text>
                </Card>
              </Col>
              <Col xs={12} sm={8} md={6}>
                <Card
                  hoverable
                  onClick={() => {
                    if (window.confirm('Are you sure you want to logout?')) {
                      localStorage.removeItem('token');
                      navigate('/login');
                    }
                  }}
                  style={{
                    background: cardColor,
                    border: "none",
                    borderRadius: 16,
                    textAlign: "center",
                    boxShadow: isDarkMode ? "0 2px 12px #0005" : "0 2px 12px #0ea5e922",
                    cursor: 'pointer'
                  }}
                >
                  <LogoutOutlined style={{ fontSize: 28, color: "#ef4444", marginBottom: 10 }} />
                  <Text style={{ color: textColor, display: "block", fontWeight: 600, fontSize: "1.08rem" }}>
                    Logout
                  </Text>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
        <ToastContainer theme={isDarkMode ? "dark" : "light"} />
      </Content>
    </Layout>
  );
};

export default ProfilePage;