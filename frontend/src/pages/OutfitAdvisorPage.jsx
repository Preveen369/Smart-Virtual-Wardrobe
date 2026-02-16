import React, { useState, useEffect } from 'react';
import { Layout, Card, Select, Button, Row, Col, Typography, Input, Spin, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import ImageUpload from '../components/ImageUpload';
import { advisorService, apiUtils } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const OutfitAdvisorPage = ({ isDarkMode }) => {
  const [nameField, setNameField] = useState('');
  const [typeField, setTypeField] = useState(null);
  const [sizeField, setSizeField] = useState(null);
  const [seasonField, setSeasonField] = useState(null);
  const [styleField, setStyleField] = useState(null);

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState(null);

  const [savedResults, setSavedResults] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        setSavedLoading(true);
        const list = await advisorService.listResults();
        setSavedResults(list || []);
      } catch (err) {
        const info = apiUtils.handleError(err);
        // non-fatal
        console.warn('Failed to load saved analyses', info);
      } finally {
        setSavedLoading(false);
      }
    };

    loadSaved();
  }, []);

  const onImageChange = (file) => {
    setSelectedImageFile(file);
  };

  const buildDescription = () => {
    const parts = [];
    if (nameField) parts.push(`Name: ${nameField}`);
    if (typeField) parts.push(`Type: ${typeField}`);
    if (sizeField) parts.push(`Size: ${sizeField}`);
    if (seasonField) parts.push(`Season: ${seasonField}`);
    if (styleField) parts.push(`Style: ${styleField}`);

    const desc = parts.length ? `Outfit details — ${parts.join(' | ')}.` : 'Outfit with no details provided.';
    return desc;
  };

  const loadSavedResults = async () => {
    try {
      setSavedLoading(true);
      const list = await advisorService.listResults();
      setSavedResults(list || []);
    } catch (err) {
      const info = apiUtils.handleError(err);
      console.warn('Failed to refresh saved analyses', info);
    } finally {
      setSavedLoading(false);
    }
  };

  const handleSubmit = async () => {
    const description = buildDescription();

    const payload = {
      description,
      outfit_name: nameField || null,
      outfit_type: typeField || null,
      outfit_size: sizeField || null,
      outfit_season: seasonField || null,
      outfit_style: styleField || null,
      image_url: uploadedImageUrl || null,
    };

    try {
      setSending(true);
      setResponse(null);
      const resp = await advisorService.analyzeOutfit(payload);
      setResponse(resp);
      // Always refresh saved analyses from the server (display DB-synced items only)
      await loadSavedResults();
      toast.success('Analysis saved');
    } catch (err) {
      const info = apiUtils.handleError(err);
      toast.error(info.message);
    } finally {
      setSending(false);
    }
  };

  const uploadImageToServer = async () => {
    if (!selectedImageFile) return null;
    try {
      // Upload to outfit-advisor specific folder via new endpoint
      const uploadResp = await advisorService.uploadImage(selectedImageFile);
      setUploadedImageUrl(uploadResp.image_url);
      toast.success('Outfit image uploaded');
      return uploadResp.image_url;
    } catch (err) {
      const info = apiUtils.handleError(err);
      toast.error(info.message);
      return null;
    }
  };

  const handleAnalyze = async () => {
    // If user selected an image, upload it first
    if (selectedImageFile && !uploadedImageUrl) {
      await uploadImageToServer();
    }
    await handleSubmit();
  };

  // Wardrobe list is still available for future use but not required for current UI

  const pageBg = isDarkMode ? '#0f0f0f' : '#f9fafb';
  const cardBg = isDarkMode ? '#18181b' : '#fff';
  const textColor = isDarkMode ? '#e6eef8' : '#0f172a';

  return (
    <Layout style={{ minHeight: '100vh', background: pageBg }}>
      <Content style={{ padding: '2rem 2.5rem' }}>
        <ToastContainer theme={isDarkMode ? 'dark' : 'light'} />
        <div className="max-w-4xl mx-auto" style={{ paddingLeft: 12, paddingRight: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <Title level={2} style={{ color: textColor, fontWeight: 800 }}>Outfit Advisor</Title>
            <Text style={{ color: isDarkMode ? '#9ca3af' : '#4b5563' }}>Select items, supply context, and get an AI evaluation.</Text>
          </div>

          <Row gutter={16} style={{ marginTop: 0 }}>
            {/* Left column: inputs (stack on small screens) */}
            <Col xs={24} md={12} style={{ marginBottom: 16 }}>
              <Card style={{ background: cardBg, borderRadius: 14, padding: '12px 18px', boxShadow: isDarkMode ? '0 6px 18px #0008' : '0 6px 18px #e6f7ff' }}>
                {/* Top/Bottom/Shoes selection removed — outfit fields below */}

                <Row gutter={16} style={{ marginTop: 8 }}>
                  <Col xs={24} md={8}>
                    <Text strong style={{ color: textColor }}>Name</Text>
                    <Input placeholder="Outfit name (optional)" value={nameField} onChange={(e) => setNameField(e.target.value)} style={{ width: '100%', marginTop: 8 }} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Text strong style={{ color: textColor }}>Type</Text>
                    <Select value={typeField} onChange={setTypeField} style={{ width: '100%', marginTop: 8 }} placeholder="Select type">
                      <Option value="shirt">Shirt</Option>
                      <Option value="tshirt">T-Shirt</Option>
                      <Option value="jacket">Jacket</Option>
                      <Option value="dress">Dress</Option>
                      <Option value="pants">Pants</Option>
                      <Option value="skirt">Skirt</Option>
                      <Option value="coat">Coat</Option>
                      <Option value="saree">Saree</Option>
                      <Option value="churidar">Churidar</Option>
                      <Option value="other">Other</Option>
                    </Select>
                  </Col>
                  <Col xs={24} md={8}>
                    <Text strong style={{ color: textColor }}>Size</Text>
                    <Select value={sizeField} onChange={setSizeField} style={{ width: '100%', marginTop: 8 }} placeholder="Select size">
                      <Option value="S">S</Option>
                      <Option value="M">M</Option>
                      <Option value="L">L</Option>
                      <Option value="XL">XL</Option>
                      <Option value="XXL">XXL</Option>
                    </Select>
                  </Col>
                </Row>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col xs={24} md={12}>
                    <Text strong style={{ color: textColor }}>Season</Text>
                    <Select value={seasonField} onChange={setSeasonField} style={{ width: '100%', marginTop: 8 }} placeholder="Select season">
                      <Option value="summer">Summer</Option>
                      <Option value="winter">Winter</Option>
                      <Option value="rainy">Rainy</Option>
                      <Option value="all">All</Option>
                    </Select>
                  </Col>
                  <Col xs={24} md={12}>
                    <Text strong style={{ color: textColor }}>Style</Text>
                    <Select value={styleField} onChange={setStyleField} style={{ width: '100%', marginTop: 8 }} placeholder="Select style">
                      <Option value="casual">Casual</Option>
                      <Option value="ethnic">Ethnic</Option>
                      <Option value="formal">Formal</Option>
                      <Option value="party">Party</Option>
                    </Select>
                  </Col>
                </Row>

                <div style={{ marginTop: 18 }}>
                  <div style={{ marginBottom: 10 }}><Text strong style={{ color: textColor }}>Optional outfit image</Text></div>
                  <ImageUpload onImageChange={onImageChange} isDarkMode={isDarkMode} height={220} />
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <Button type="primary" onClick={handleAnalyze} disabled={sending} style={{ borderRadius: 999 }}>
                    {sending ? <span><Spin size="small" />&nbsp;Analyzing...</span> : 'Analyze Outfit' }
                  </Button>
                  <Button onClick={() => { setNameField(''); setTypeField(null); setSizeField(null); setSeasonField(null); setStyleField(null); setSelectedImageFile(null); setUploadedImageUrl(null); setResponse(null); }}>
                    Reset
                  </Button>
                </div>
              </Card>
            </Col>

            {/* Right column: AI Evaluation (only) */}
            <Col xs={24} md={12}>
              <Card style={{ background: cardBg, borderRadius: 12 }}>
                <Title level={4} style={{ marginBottom: 8, color: textColor }}>AI Evaluation</Title>
                {sending && <div style={{ padding: 16 }}><Spin /> Sending to AI...</div>}
                {!sending && !response && <Text type="secondary">No evaluation yet. Click "Analyze Outfit" to get suggestions.</Text>}
                {response && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Text strong>Suitability Score:</Text>
                      <Text style={{ fontSize: 20, fontWeight: 800, color: '#0ea5e9' }}>{response.suitability_score ?? response.score ?? '—'}</Text>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Recommendation:</Text>
                      <div style={{ marginTop: 6 }}>{response.recommendation ?? response.recommended ?? '—'}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Explanation (detailed context):</Text>
                      <div style={{ marginTop: 6 }}>{response.explanation ?? response.reason ?? '—'}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Improvement Suggestions:</Text>
                      <div style={{ marginTop: 6 }}>{response.improvement_suggestions ?? response.suggestions ?? '—'}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <Text strong>Better Outfit Idea:</Text>
                      <div style={{ marginTop: 6 }}>{response.better_outfit_idea ?? response.alternative ?? '—'}</div>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          </Row>

          {/* Saved Analyses remains full-width at the bottom (unchanged) */}
          <div style={{ marginTop: 20 }}>
            <Card style={{ background: cardBg, borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ marginBottom: 8, color: textColor }}>Saved Analyses</Title>
                <Button size="small" onClick={loadSavedResults} disabled={savedLoading}>Refresh</Button>
              </div>
              {savedLoading && <div style={{ padding: 12 }}><Spin /> Loading saved analyses...</div>}
              {!savedLoading && savedResults.length === 0 && (
                <Text type="secondary">No saved analyses yet — results are stored automatically after analysis.</Text>
              )}
              {!savedLoading && savedResults.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {savedResults.map((r) => (
                    <Card key={r.id} size="small" style={{ borderRadius: 10, background: isDarkMode ? '#0b1220' : '#f8fafc' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {(r.outfit_name || r.description) && (
                              <Text strong style={{ color: textColor }}>{r.outfit_name || r.description}</Text>
                            )}
                          </div>
                          <div style={{ marginTop: 8, color: isDarkMode ? '#9ca3af' : '#6b7280' }}>{r.explanation || ''}</div>
                          {r.improvement_suggestions && <div style={{ marginTop: 6, fontSize: 13 }}>Suggestions: {r.improvement_suggestions}</div>}
                          {r.better_outfit_idea && <div style={{ marginTop: 6, fontSize: 13 }}>Better idea: {r.better_outfit_idea}</div>}
                        </div>
                        <div style={{ width: 140, textAlign: 'right' }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: '#0ea5e9' }}>{r.suitability_score ?? '—'}</div>
                          <div style={{ marginTop: 6 }}>{r.recommendation ?? '—'}</div>
                          <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={async () => { await advisorService.getResult(r.id).then((doc) => { setResponse(doc); window.scrollTo({ top: 0, behavior: 'smooth' }); }).catch(() => {}); }}>Load</Button>
                            <Button size="small" danger onClick={async () => { try { await advisorService.deleteResult(r.id); toast.success('Deleted'); await loadSavedResults(); } catch (err) { const info = apiUtils.handleError(err); toast.error(info.message); } }}>Delete</Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      </Content>
    </Layout>
  );
};

export default OutfitAdvisorPage;
