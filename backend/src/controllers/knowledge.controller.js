import KnowledgeSource from "../models/knowledgeSource.model.js";
import mongoose from "mongoose";
// Import PDF text extraction service
import { extractPDFText } from "../services/pdf.service.js";

import { scrapeWebsite } from "../services/website.service.js";
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
        // Log the actual scraping error for debugging
        console.error("Website Scraping Error:", error.message);

        // Return a meaningful response to the frontend
        return res.status(422).json({
          success: false,
          message: "Unable to scrape this website. Please check the URL.",
        });
      }
    }

    // Create a new knowledge source in MongoDB
    const knowledgeSource = await KnowledgeSource.create({
      tenantId: req.tenantId,
      name,
      type,
      sourceUrl,
      content,

      // Mark website completed after successful scraping
      status: type === "website" ? "completed" : "pending",
    });

    // Send successful response
    return res.status(201).json({
      success: true,
      message: "Knowledge source created successfully",
      data: knowledgeSource,
    });
  } catch (error) {
    // Print unexpected errors in backend terminal
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
    }).sort({ createdAt: -1 }); // Latest sources first

    // Send sources to frontend
    return res.status(200).json({
      success: true,
      count: sources.length,
      data: sources,
    });
  } catch (error) {
    // Print error in backend terminal
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

    // If source does not exist or belongs to another company
    if (!source) {
      return res.status(404).json({
        success: false,
        message: "Knowledge source not found",
      });
    }

    // Send successful response
    return res.status(200).json({
      success: true,
      message: "Knowledge source deleted successfully",
    });
  } catch (error) {
    // Log error in backend terminal
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

    filePath = req.file.path;

    // Get PDF name from frontend
    const name = req.body.name?.trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "PDF name is required",
      });
    }

    // Extract readable text from uploaded PDF
    const content = await extractPDFText(filePath);

    // Create PDF knowledge source in MongoDB
    const knowledgeSource = await KnowledgeSource.create({
      tenantId: req.tenantId,
      name,
      type: "pdf",
      // Store original PDF filename because temporary file is deleted
      sourceUrl: req.file.originalname,
      content,
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
