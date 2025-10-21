import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Spinner, Button } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./markdown.css"; // Optional: for nicer styling
// just below imports
import { FaArrowLeft } from "react-icons/fa";

const API = process.env.REACT_APP_API_URL;

function BlogView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await axios.get(`${API}/articles/${slug}`);
        setBlog(res.data);
      } catch (err) {
        console.error("Error fetching blog:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
        <p className="mt-2">Loading blog...</p>
      </Container>
    );
  }

  if (!blog) {
    return (
      <Container className="text-center mt-5">
        <h2>Blog not found</h2>
        <Button variant="secondary" onClick={() => navigate("/")}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

 return (
  <Container className="my-5" style={{ maxWidth: "800px" }}>
    <Button
      variant="secondary"
      onClick={() => navigate("/")}
      className="mb-4"
    >
      <FaArrowLeft className="me-2" />
      Back to Dashboard
    </Button>

    <h1 className="fw-bold mb-3">{blog.title}</h1>
    <p className="text-muted mb-3">
      SEO Score: {blog.seoScore || "N/A"} | Read Time: {blog.readTime} min
    </p>
    <hr />

    <div className="markdown-body mt-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {blog.content}
      </ReactMarkdown>
    </div>
  </Container>
);

}

export default BlogView;
