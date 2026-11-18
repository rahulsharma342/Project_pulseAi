
import { PDFParse } from "pdf-parse";
import fs from "fs/promises";

// Extract readable text from an uploaded PDF file
export const extractPDFText = async (filePath) => {
  let parser;

  try {
    // Read the uploaded PDF file
    const fileBuffer = await fs.readFile(filePath);

    // Initialize PDF parser
    parser = new PDFParse({
      data: fileBuffer,
    });

    // Extract text from PDF pages
    const result = await parser.getText();

    // Remove unnecessary spaces and empty lines
    const text = result.text.replace(/\s+/g, " ").trim();

    // Reject PDFs that contain no readable text
    if (!text) {
      throw new Error("No readable text found in PDF");
    }

    return text;
  } catch (error) {
    console.error("PDF Extraction Error:", error.message);
    throw new Error("Unable to extract text from PDF");
  } finally {
    // Release parser resources
    if (parser) {
      await parser.destroy();
    }
  }
};
