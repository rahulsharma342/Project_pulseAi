// Split large text into smaller chunks for RAG
export const splitTextIntoChunks = (
  text,
  chunkSize = 1000,
  overlap = 200
) => {
  // Validate input text
  if (!text || typeof text !== "string") {
    throw new Error("Valid text is required");
  }

  // Validate chunk settings
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error("Invalid chunk size or overlap");
  }

  // Normalize unnecessary whitespace
  const cleanedText = text.replace(/\s+/g, " ").trim();

  if (!cleanedText) {
    throw new Error("Text cannot be empty");
  }

  const chunks = [];
  let start = 0;

  // Split text while maintaining overlap between chunks
  while (start < cleanedText.length) {
    const end = start + chunkSize;

    const chunk = cleanedText.slice(start, end).trim();

    if (chunk) {
      chunks.push(chunk);
    }

    // Move forward while preserving overlapping text
    start += chunkSize - overlap;
  }

  return chunks;
};

