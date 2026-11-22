
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize Gemini embedding model
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY || process.env.GEMINI_API_Key,
});

// Generate embeddings for multiple text chunks
export const generateEmbeddings = async (texts) => {
  // Validate input
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Text array is required for embeddings");
  }

  // Generate numerical vectors from text
  const vectors = await embeddings.embedDocuments(texts);

  return vectors;
};

// Generate embedding for a single user query
export const generateQueryEmbedding = async (text) => {
  if (!text || typeof text !== "string") {
    throw new Error("Valid query text is required");
  }

  const vector = await embeddings.embedQuery(text);

  return vector;
};
