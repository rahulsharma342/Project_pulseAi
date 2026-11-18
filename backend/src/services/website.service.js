import axios from "axios";
import { load } from "cheerio";


// Validate website URL before making an HTTP request
const validateWebsiteURL = (url) => {
  try {
    // Convert the input into a URL object
    const parsedURL = new URL(url);

    // Allow only HTTP and HTTPS protocols
    if (!["http:", "https:"].includes(parsedURL.protocol)) {
      throw new Error("Only HTTP and HTTPS URLs are allowed");
    }

    // Block localhost and local machine addresses
    const hostname = parsedURL.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    ) {
      throw new Error("Local URLs are not allowed");
    }

    // Block URLs containing username or password
    if (parsedURL.username || parsedURL.password) {
      throw new Error("URLs containing credentials are not allowed");
    }

    return parsedURL;
  } catch (error) {
    throw new Error(error.message || "Invalid website URL");
  }
};
// Fetch HTML content from a website URL
export const fetchWebsiteHTML = async (url) => {
  try {
    // Validate URL before making an HTTP request
    const validURL = validateWebsiteURL(url);
    // Send request to the website
    const response = await axios.get(validURL.href, {
      timeout: 15000,
      maxContentLength: 2 * 1024 * 1024, // Maximum response size: 2 MB
      maxBodyLength: 2 * 1024 * 1024,// Maximum request body size: 2 MB
      maxRedirects: 0, // Disable automatic redirects for security
      headers: {
        // Identify our request as a browser-like request
        "User-Agent": "Mozilla/5.0 SupportPulseAI Bot",
      },
    });
    // Check whether the website returned HTML content
const contentType = response.headers["content-type"] || "";

if (!contentType.includes("text/html")) {
  throw new Error("URL does not contain an HTML page");
}
    // Return the website's HTML
    return response.data;
  } catch (error) {
    console.error("Website Fetch Error:", error.message);

    // Forward the error to the controller
    throw new Error("Unable to fetch website content");
  }
};

// Extract clean text from website HTML
export const extractWebsiteText = (html) => {
  // Load HTML into Cheerio
  const $ = load(html);

  // Remove unnecessary HTML elements
  $("script, style, nav, footer, header, noscript").remove();

  // Extract readable text from the body
  const text = $("body").text();

  // Remove extra spaces and empty lines
  return text.replace(/\s+/g, " ").trim();
};

// Fetch a website and extract its clean text
export const scrapeWebsite = async (url) => {
  // First, fetch the website HTML
  const html = await fetchWebsiteHTML(url);

  // Then, extract readable text from HTML
  const text = extractWebsiteText(html);

  // Check whether any useful text was extracted
  if (!text) {
    throw new Error("No readable content found on website");
  }

  // Return clean website text
  return text;
};