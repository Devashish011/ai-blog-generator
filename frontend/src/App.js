import React, { useEffect, useState } from "react";
import axios from "axios";
import { Routes, Route, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Spinner,
  Badge,
} from "react-bootstrap";
import { FaPlus, FaTrash, FaExternalLinkAlt } from "react-icons/fa";
import BlogView from "./BlogView";

const API = process.env.REACT_APP_API_URL;

function Dashboard() {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState({
    keywords: "",
    tone: "friendly",
    length: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/articles`);
      setArticles(res.data.articles);
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteArticle = async (slug) => {
    if (!window.confirm("Delete this article?")) return;
    try {
      await axios.delete(`${API}/articles/${slug}`);
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const generateBlog = async () => {
    if (!form.keywords.trim()) {
      alert("Please enter some keywords before generating a blog.");
      return;
    }
    setGenerating(true);
    try {
      await axios.post(`${API}/generate`, {
        keywords: form.keywords.split(",").map((k) => k.trim()),
        tone: form.tone,
        length: form.length,
      });
      fetchArticles();
    } catch (err) {
      alert("Blog generation failed");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <Container className="py-5">
        <div className="text-center mb-5">
          <h1 className="fw-bold display-5 mb-2">🧠 AI Blog Generator</h1>
          <p className="text-muted">Generate SEO-optimized blogs with one click</p>
        </div>

        {/* Blog Generation Card */}
        <Card className="shadow-sm border-0 mb-5">
          <Card.Body>
            <Card.Title className="fw-semibold mb-4">
              <FaPlus className="me-2" />
              Generate New Blog
            </Card.Title>
            <Row className="g-3 align-items-center">
              <Col md={4}>
                <Form.Control
                  type="text"
                  placeholder="Keywords (comma separated)"
                  value={form.keywords}
                  onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                />
              </Col>
              <Col md={3}>
                <Form.Select
                  value={form.tone}
                  onChange={(e) => setForm({ ...form, tone: e.target.value })}
                >
                  <option value="friendly">Friendly</option>
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={form.length}
                  onChange={(e) => setForm({ ...form, length: e.target.value })}
                >
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button
                  variant="primary"
                  className="w-100"
                  onClick={generateBlog}
                  disabled={generating}
                >
                  {generating ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Generate"
                  )}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Blog List */}
        <h4 className="fw-semibold mb-3">📰 Your Blogs</h4>

        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" />
            <p className="text-muted mt-2">Loading blogs...</p>
          </div>
        ) : articles.length === 0 ? (
          <p className="text-center text-muted">No blogs yet. Generate one!</p>
        ) : (
          <Row className="g-4">
            {articles.map((a) => (
              <Col md={6} lg={4} key={a._id}>
                <Card className="shadow-sm h-100 border-0">
                  <Card.Body>
                    <Card.Title className="fw-bold">{a.title}</Card.Title>
                    <Card.Subtitle className="text-muted mb-2 small">
                      {a.keywords && a.keywords.slice(0, 3).join(", ")}
                    </Card.Subtitle>
                    <Card.Text style={{ fontSize: "0.9rem" }}>
                      {a.metaDescription?.slice(0, 120)}...
                    </Card.Text>

                    <div className="d-flex justify-content-between align-items-center">
                      <Link
                        to={`/blog/${a.slug}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        View Full <FaExternalLinkAlt className="ms-1" />
                      </Link>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => deleteArticle(a.slug)}
                      >
                        <FaTrash />
                      </Button>
                    </div>

                    <div className="mt-3">
                      <Badge bg="info" className="me-2">
                        {a.tone}
                      </Badge>
                      <Badge bg="secondary">
                        {a.length.charAt(0).toUpperCase() + a.length.slice(1)}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/blog/:slug" element={<BlogView />} />
    </Routes>
  );
}

export default App;
