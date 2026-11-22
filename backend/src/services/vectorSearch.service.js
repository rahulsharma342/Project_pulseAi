
import mongoose from "mongoose";
import KnowledgeSource from "../models/knowledgeSource.model.js";
import { generateQueryEmbedding } from "./embedding.service.js";

// Calculate cosine similarity between two embedding vectors
const calculateCosineSimilarity = (vectorA, vectorB) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (!magnitudeA || !magnitudeB) return 0;

  return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
};

// Retrieve relevant chunks for a tenant
export const searchRelevantChunks = async (
  query,
  tenantId,
  limit = 5
) => {
  if (!query || typeof query !== "string") {
    throw new Error("Valid search query is required");
  }

  if (!mongoose.Types.ObjectId.isValid(tenantId)) {
    throw new Error("Valid tenant ID is required");
  }

  // Generate embedding for the user's question
  const queryVector = await generateQueryEmbedding(query);

  // Search parent documents using their nested chunk embeddings
  const documents = await KnowledgeSource.aggregate([
    {
      $vectorSearch: {
        index: "knowledge_vector_index",
        path: "chunks.embedding",
        queryVector,
        numCandidates: 100,
        limit: 20,
        parentFilter: {
          tenantId: new mongoose.Types.ObjectId(tenantId),
        },
        nestedOptions: {
          scoreMode: "max",
        },
      },
    },
    {
      $project: {
        name: 1,
        type: 1,
        sourceUrl: 1,
        chunks: 1,
      },
    },
  ]);

  // Compare individual chunks with the user's question
  const results = [];

  for (const document of documents) {
    for (const chunk of document.chunks || []) {
      if (
        !Array.isArray(chunk.embedding) ||
        chunk.embedding.length !== queryVector.length
      ) {
        continue;
      }

      const score = calculateCosineSimilarity(
        queryVector,
        chunk.embedding
      );

      results.push({
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        score,
        sourceName: document.name,
        sourceType: document.type,
        sourceUrl: document.sourceUrl,
      });
    }
  }

  // Return the most relevant chunks first
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};
