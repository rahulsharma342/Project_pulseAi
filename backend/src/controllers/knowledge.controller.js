
import KnowledgeSource from "../models/knowledgeSource.model.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { generateEmbeddings } from "../services/embedding.service.js";

// Import PDF text extraction service
import { extractPDFText } from "../services/pdf.service.js";

// Import website scraping service
import { scrapeWebsite } from "../services/website.service.js";

// Import text chunking service
import { splitTextIntoChunks } from "../services/chunk.service.js";

// Add a new knowledge source for the logged-in company
export const createKnowledgeSource = async (req, res) => {
  try {
    // Get source details from frontend request
    const name = req.body.name?.trim();
    const type = req.body.type?.trim().toLowerCase();
    const sourceUrl = req.body.sourceUrl?.trim();

    // Check whether all required fields are provided
    if (!name || !type || !sourceUrl) {
      return res.status(400).json({
        success: false,
        message: "Name, type and sourceUrl are required",
      });
    }

    // Allow only website or PDF sources
    if (!["website", "pdf"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid source type",
      });
    }

    // Validate website URL
    if (type === "website") {
      try {
        const parsedUrl = new URL(sourceUrl);

        // Allow only HTTP and HTTPS websites
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          return res.status(400).json({
            success: false,
            message: "Only HTTP and HTTPS URLs are allowed",
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid website URL",
        });
      }
    }

    // Check whether this source already exists for this company
    const existingSource = await KnowledgeSource.findOne({
      tenantId: req.tenantId,
      type,
      sourceUrl,
    });

    if (existingSource) {
      return res.status(409).json({
        success: false,
        message: "This knowledge source already exists",
      });
    }

    // Store extracted website content
    let content = "";

    // Scrape website only when source type is website
    if (type === "website") {
      try {
        // Fetch website and extract readable text
        content = await scrapeWebsite(sourceUrl);
      } catch (error) {
        console.error("Website Scraping Error:", error.message);

        return res.status(422).json({
          success: false,
          message: "Unable to scrape this website. Please check the URL.",
        });
      }
    }

    // Split website content into smaller chunks
    let chunks =
      type === "website"
        ? splitTextIntoChunks(content).map((text, index) => ({
            text,
            chunkIndex: index,
          }))
        : [];

    // Generate embeddings for all website chunks
    if (chunks.length > 0) {
      const vectors = await generateEmbeddings(
        chunks.map((chunk) => chunk.text)
      );

      // Attach each embedding to its corresponding chunk
      chunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: vectors[index],
      }));
    }

    // Create a new knowledge source in MongoDB
    const knowledgeSource = await KnowledgeSource.create({
      tenantId: req.tenantId,
      name,
      type,
      sourceUrl,
      content,
      chunks,

      // Mark website completed after successful processing
      status: type === "website" ? "completed" : "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Knowledge source created successfully",
      data: knowledgeSource,
    });
  } catch (error) {
    console.error("Create Knowledge Source Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get all knowledge sources of the logged-in company
export const getKnowledgeSources = async (req, res) => {
  try {
    // Find only those sources that belong to this company
    const sources = await KnowledgeSource.find({
      tenantId: req.tenantId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    console.error("Get Knowledge Sources Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Delete a knowledge source belonging to the logged-in company
export const deleteKnowledgeSource = async (req, res) => {
  try {
    // Get source ID from the URL parameter
    const { id } = req.params;

    // Check whether the provided ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid knowledge source ID",
      });
    }

    // Find and delete only if this source belongs to the logged-in company
    const source = await KnowledgeSource.findOneAndDelete({
      _id: id,
      tenantId: req.tenantId,
    });

    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Knowledge source not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Knowledge source deleted successfully",
    });
  } catch (error) {
    console.error("Delete Knowledge Source Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Upload and process a PDF knowledge source
export const uploadPDFKnowledgeSource = async (req, res) => {
  let filePath;

  try {
    // Check whether a PDF file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a PDF file",
      });
    }

    // Import file system module
    const fs = await import("fs/promises");

    filePath = req.file.path;

    // Read uploaded PDF file
    const fileBuffer = await fs.readFile(filePath);

    // Generate SHA-256 hash of PDF content
    const fileHash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .digest("hex");

    // Get PDF name from frontend
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "PDF name is required",
      });
    }

    // Check whether identical PDF already exists for this tenant
    const existingSource = await KnowledgeSource.findOne({
      tenantId: req.tenantId,
      type: "pdf",
      fileHash,
    });

    if (existingSource) {
      return res.status(409).json({
        success: false,
        message: "This PDF has already been uploaded",
      });
    }

    // Extract readable text from uploaded PDF
    const content = await extractPDFText(filePath);

    // Split extracted PDF text into smaller chunks
    let chunks = splitTextIntoChunks(content).map((text, index) => ({
      text,
      chunkIndex: index,
    }));

    // Generate embeddings for all PDF chunks
    if (chunks.length > 0) {
      const vectors = await generateEmbeddings(
        chunks.map((chunk) => chunk.text)
      );

      // Attach each embedding to its corresponding chunk
      chunks = chunks.map((chunk, index) => ({
        ...chunk,
        embedding: vectors[index],
      }));
    }

    // Save processed PDF knowledge source in MongoDB
    const knowledgeSource = await KnowledgeSource.create({
      tenantId: req.tenantId,
      name,
      type: "pdf",
      sourceUrl: req.file.originalname,
      content,
      chunks,
      fileHash,
      status: "completed",
    });

    return res.status(201).json({
      success: true,
      message: "PDF uploaded and processed successfully",
      data: knowledgeSource,
    });
  } catch (error) {
    console.error("PDF Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to process PDF file",
    });
  } finally {
    // Delete temporary uploaded file after processing
    if (filePath) {
      try {
        const fs = await import("fs/promises");
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.error("PDF Cleanup Error:", cleanupError.message);
      }
    }
  }
};
