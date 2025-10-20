import express from "express";
import {
  generateBlog,
  getAllArticles,
  getArticleBySlug,
  deleteArticle,
} from "../controllers/blogController.js";

const router = express.Router();

router.post("/generate", generateBlog);
router.get("/articles", getAllArticles);
router.get("/articles/:slug", getArticleBySlug);
router.delete("/articles/:slug", deleteArticle);

export default router;
