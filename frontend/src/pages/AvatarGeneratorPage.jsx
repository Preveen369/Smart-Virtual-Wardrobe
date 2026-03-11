import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Layout,
  ConfigProvider,
  theme,
  Button,
  Typography,
  Row,
  Col,
  Spin,
  Empty,
  Card,
} from "antd";

// helper to normalize video preview values returned by backend
function normalizeVideoPreview(vp, baseUrl) {
  if (typeof vp === "string") {
    return vp.startsWith("/") ? `${baseUrl}${vp}` : vp;
  }
  if (Array.isArray(vp)) {
    return vp.map((v) => normalizeVideoPreview(v, baseUrl));
  }
  if (vp && typeof vp === "object") {
    const candidate = vp.path || vp.url || vp.name;
    if (candidate && typeof candidate === "string") {
      return normalizeVideoPreview(candidate, baseUrl);
    }
  }
  return vp; // leave whatever it is
}

// returns a style object for a card given theme info and extras
function cardStyle(isDarkMode, extras = {}) {
  const common = {
    background: isDarkMode ? "#1c1c1c" : "#ffffff",
    padding: 32,
    borderRadius: 20,
    boxShadow: isDarkMode ? "0 2px 16px #0006" : "0 2px 16px #0ea5e933",
    maxWidth: "520px",
    width: "100%",
    margin: "0 auto",
  };
  return { ...common, ...extras };
}

import ImageUpload from "../components/ImageUpload";
import GLBViewer from "../components/GLBViewer";
import { avatarService, threeDService, apiUtils, API_BASE_URL } from "../services/api";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

function UploadCard({
  isDarkMode,
  loading,
  loadingVideo,
  loadingGlb,
  handleGenerateAvatar,
  handleGenerateVideo,
  handleGenerateGlb,
  onImageChange, // callback from parent
}) {
  const card = cardStyle(isDarkMode, { minHeight: 340, marginBottom: 8 });
  return (
    <Col xs={24} md={12}>
      <div style={card}>
        <Title
          level={4}
          style={{ color: isDarkMode ? "#e4e4e4" : "#111827", marginBottom: 18, fontWeight: 700, fontSize: '1.18rem', letterSpacing: 0.3 }}
        >
          <span style={{ borderBottom: `2.5px solid #0ea5e9`, paddingBottom: 2 }}>
            Upload Image
          </span>
        </Title>

        <ImageUpload
          label="Upload image for any action"
          onImageChange={onImageChange}
          isDarkMode={isDarkMode}
        />

        <Row gutter={8} style={{ marginTop: 24 }}>
          <Col flex="auto">
            <Button
              type="primary"
              block
              loading={loading}
              onClick={handleGenerateAvatar}
            >
              Generate Avatar
            </Button>
          </Col>
          <Col flex="auto">
            <Button
              block
              loading={loadingVideo}
              onClick={handleGenerateVideo}
            >
              Generate Video
            </Button>
          </Col>
          <Col flex="auto">
            <Button
              block
              loading={loadingGlb}
              onClick={handleGenerateGlb}
            >
              Generate 3D Model
            </Button>
          </Col>
        </Row>
      </div>
    </Col>
  );
}

function ResultsColumn({
  avatarResult,
  videoPreview,
  glbUrl,
  isDarkMode,
}) {
  const resultCommon = cardStyle(isDarkMode);
  const inner = ({ children, extras = {} }) => (
    <div style={{ ...resultCommon, ...extras }} className="mt-12 md:mt-0 flex justify-center">
      {children}
    </div>
  );
  return (
    <Col xs={24} md={12}>
      {avatarResult && inner({
        children: (
          <img
            src={avatarResult.imageUrl}
            alt="generated avatar"
            style={{ maxWidth: "450px", minHeight: "340px", width: "100%", borderRadius: 16 }}
          />
        ),
        extras: { minHeight: 340, maxHeight: 400 },
      })}
      {videoPreview && inner({
        children: Array.isArray(videoPreview) ? (
          videoPreview.map((vp, idx) => (
            <video
              key={idx}
              controls
              src={typeof vp === 'string' ? vp : vp.path || vp.url || ''}
              style={{ maxWidth: '400px', width: '100%', borderRadius: 16, marginBottom: 12 }}
            />
          ))
        ) : (
          <video
            controls
            src={typeof videoPreview === 'string' ? videoPreview : videoPreview.path || videoPreview.url || ''}
            style={{ maxWidth: '400px', width: '100%', borderRadius: 16 }}
          />
        ),
        extras: { marginBottom: 32, maxHeight: 320 },
      })}
      {glbUrl && inner({
        children: <GLBViewer url={glbUrl} />, 
        extras: { display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 32 },
      })}

      {/* default empty placeholder when nothing generated yet */}
      {!avatarResult && !videoPreview && !glbUrl && (
        <div style={resultCommon} className="mt-12 md:mt-0 flex justify-center">
          <Card
            style={{
              background: isDarkMode ? '#18181b' : '#fff',
              border: 'none',
              borderRadius: 20,
              textAlign: 'center',
              padding: '4.5rem 2.5rem',
              marginLeft: 40,
              marginRight: 40,
            }}
          >
            <Empty description={
              <span style={{ color: isDarkMode ? '#e4e4e4' : '#111827', fontSize: '1.13rem', fontWeight: 600 }}>
                No results yet. Upload an image to get started.
              </span>
            } />
          </Card>
        </div>
      )}
    </Col>
  );
}


function AvatarGeneratorPage({ isDarkMode }) {
  // shared state
  const [inputImage, setInputImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [avatarResult, setAvatarResult] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [loadingGlb, setLoadingGlb] = useState(false);
  const [glbUrl, setGlbUrl] = useState(null);

  // wrapper for image change so clearing the upload also resets results
  const handleImageChange = (file) => {
    setInputImage(file);
    if (!file) {
      setAvatarResult(null);
      setVideoPreview(null);
      setGlbUrl(null);
    }
  };

  const { defaultAlgorithm, darkAlgorithm } = theme;

  const handleGenerateAvatar = async () => {
    if (!inputImage) {
      toast.error("Please upload an image first");
      return;
    }

    const qualityPrefix = `\n    complete masterpiece, best quality, ultra high resolution, photorealistic,\n    8K, extremely detailed, sharp focus, professional lighting, cinematic,\n    hyperrealistic\n    `;
    const finalPrompt = `${qualityPrefix}`;

    setLoading(true);
    try {
      const response = await avatarService.generateAvatar(finalPrompt, inputImage);
      const newResult = {
        id: Date.now(),
        imageUrl: response.image_url,
        prompt: finalPrompt,
        timestamp: new Date().toLocaleString(),
      };
      setAvatarResult(newResult);

      const prev = JSON.parse(localStorage.getItem("avatar_history") || "[]");
      localStorage.setItem("avatar_history", JSON.stringify([newResult, ...prev]));
      toast.success("Avatar generated successfully!");
    } catch (error) {
      const errInfo = apiUtils.handleError(error);
      toast.error(errInfo.message);
    } finally {
      setLoading(false);
    }
  };

  // handlers for the 3D/video actions using shared inputImage
  const handleGenerateVideo = async () => {
    if (!inputImage) {
      toast.error("Please upload an image first");
      return;
    }
    setLoadingVideo(true);
    try {
      const resp = await threeDService.generateVideo(inputImage);
      setVideoPreview(normalizeVideoPreview(resp.video_preview, API_BASE_URL));
      toast.success("Video generated!");
    } catch (err) {
      const errInfo = apiUtils.handleError(err);
      toast.error(errInfo.message);
    } finally {
      setLoadingVideo(false);
    }
  };

  const handleGenerateGlb = async () => {
    if (!inputImage) {
      toast.error("Please upload an image first");
      return;
    }
    setLoadingGlb(true);
    try {
      const resp = await threeDService.generate(inputImage, true);
      setVideoPreview(normalizeVideoPreview(resp.video_preview, API_BASE_URL));
      setGlbUrl(`${API_BASE_URL}${resp.glb_url}`);
      toast.success("3D model ready!");
    } catch (err) {
      const errInfo = apiUtils.handleError(err);
      toast.error(errInfo.message);
    } finally {
      setLoadingGlb(false);
    }
  };

  const bgColor = isDarkMode ? "#0f0f0f" : "#f9fafb";
  const textColor = isDarkMode ? "#e4e4e4" : "#111827";

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
        <ToastContainer theme={isDarkMode ? "dark" : "light"} />
        <Header
          style={{
            background: "transparent",
            display: "flex",
            alignItems: "center",
            padding: "1.5rem 2rem",
          }}
        ></Header>
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
              <span style={{ color: "#0ea5e9", borderBottom: "4px solid #0ea5e9", paddingBottom: 4 }}>
                AI 3D Avatar Styling Generator
              </span>
            </Title>

            <Row gutter={[10, 40]}>
              <UploadCard
                isDarkMode={isDarkMode}
                loading={loading}
                loadingVideo={loadingVideo}
                loadingGlb={loadingGlb}
                handleGenerateAvatar={handleGenerateAvatar}
                handleGenerateVideo={handleGenerateVideo}
                handleGenerateGlb={handleGenerateGlb}
                onImageChange={handleImageChange}
              />
              <ResultsColumn
                avatarResult={avatarResult}
                videoPreview={videoPreview}
                glbUrl={glbUrl}
                isDarkMode={isDarkMode}
              />
            </Row>

            {loading && (
              <div className="text-center mt-12">
                <Spin size="large" />
              </div>
            )}

          </div>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}

export default AvatarGeneratorPage;