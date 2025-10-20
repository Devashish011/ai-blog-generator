import slugify from "slugify";
import axios from "axios";
import Article from "../models/Article.js";

// Helper function: map length to approximate word count
const lengthToWords = (len) => {
  const map = { short: 400, medium: 800, long: 1500 };
  return map[len] || 800;
};

export async function generateBlog(req, res) {
  try {
    const { keywords = [], tone = "neutral", length = "medium" } = req.body;
    const targetWords = lengthToWords(length);

    // Create the LLM prompt
    const prompt = `
Generate an SEO-friendly blog post of about ${targetWords} words.
Tone: ${tone}.
Keywords: ${keywords.join(", ")}.
The blog must include:
1. A catchy title (first line)
2. A meta description (second line, under 160 characters)
3. Multiple headings and short paragraphs.
4. Use markdown or plain text only.
    `.trim();

    // ✅ OpenRouter API request
    const response = await axios.post(
      process.env.LLM_ENDPOINT_URL,
      {
        model: process.env.LLM_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert SEO content writer who writes engaging and optimized blog posts.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.LLM_API_KEY}`,
          "HTTP-Referer": "http://localhost:4000",
          "X-Title": "AI Blog Generator",
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Extract the generated article
    const articleText =
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "No content generated.";

    // Parse response
    const lines = articleText.split("\n").filter((l) => l.trim() !== "");
    const title = lines[0]?.replace(/^#\s*/, "") || "Untitled Blog";
    const metaDescription =
      lines[1]?.slice(0, 160) || `An article about ${keywords.join(", ")}`;
    const content = lines.slice(2).join("\n\n");
    const slug = slugify(title, { lower: true, strict: true });

    // ------------------ SEO Analysis ------------------ //
    const plainText = content.replace(/[#_*>\-`]/g, ""); // remove markdown symbols
    const words = plainText.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Average reading speed ≈ 200 words/min
    const readTime = Math.ceil(wordCount / 200);

    // Keyword density
    const keywordDensity = {};
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, "gi");
      const count = (plainText.match(regex) || []).length;
      const density = ((count / wordCount) * 100).toFixed(2);
      keywordDensity[kw] = parseFloat(density);
    });

    // Simple SEO scoring system
    let seoScore = 0;
    seoScore += wordCount > 500 ? 30 : 10;
    seoScore += Object.values(keywordDensity).some((v) => v > 1 && v < 3)
      ? 40
      : 10;
    seoScore += metaDescription.length < 160 ? 20 : 10;
    seoScore += tone.toLowerCase().includes("friendly") ? 10 : 0;
    seoScore = Math.min(seoScore, 100);

    // ✅ Save to MongoDB
    const newArticle = new Article({
      title,
      slug,
      metaDescription,
      keywords,
      tone,
      content,
      length,
      wordCount,
      readTime,
      keywordDensity,
      seoScore,
    });

    await newArticle.save();

    // ✅ Success response
    res.status(201).json({
      message: "Blog generated and saved",
      article: newArticle,
    });
  } catch (err) {
    console.error("generateBlog error:", err?.response?.data || err.message);
    res.status(500).json({
      error: "Blog generation failed",
      details: err.message,
      response: err.response?.data || null,
    });
  }
}

// ------------------------------------------------------------
// Get all articles (with optional pagination and sorting)
// ------------------------------------------------------------
export async function getAllArticles(req, res) {
  try {
    const { page = 1, limit = 5, sort = "desc" } = req.query;
    const skip = (page - 1) * limit;

    const articles = await Article.find()
      .sort({ createdAt: sort === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments();

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      articles,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch articles", details: err.message });
  }
}

// ------------------------------------------------------------
// Get a single article by slug
// ------------------------------------------------------------
export const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log("Searching article with slug:", slug);

    const article = await Article.findOne({ slug });
    console.log("Found article:", article);

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.json(article);
  } catch (err) {
    console.error("Error fetching article:", err);
    res.status(500).json({ message: "Error fetching article" });
  }
};



// ------------------------------------------------------------
// Delete an article by slug
// ------------------------------------------------------------
export async function deleteArticle(req, res) {
  try {
    const { slug } = req.params;
    const deleted = await Article.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({ error: "Article not found" });
    }

    res
      .status(200)
      .json({ message: "Article deleted successfully", slug: deleted.slug });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error deleting article", details: err.message });
  }
}

// ------------------------------------------------------------
// Get top SEO-ranked articles
// ------------------------------------------------------------
export async function getTopSEOArticles(req, res) {
  try {
    const { limit = 5, minScore = 50 } = req.query;

    const articles = await Article.find({ seoScore: { $gte: minScore } })
      .sort({ seoScore: -1, createdAt: -1 })
      .limit(parseInt(limit));

    if (!articles.length) {
      return res.status(404).json({
        message: "No articles found above the given SEO score threshold.",
      });
    }

    res.status(200).json({
      count: articles.length,
      minScore: parseInt(minScore),
      articles,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Error fetching top SEO articles", details: err.message });
  }
}
