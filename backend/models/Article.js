import mongoose from "mongoose";

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    metaDescription: String,
    keywords: [String],
    tone: String,
    content: { type: String, required: true },
    length: String,
    seoScore: Number,
    readTime: Number,
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);
export default Article;
