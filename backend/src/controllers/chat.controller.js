
import { searchRelevantChunks } from "../services/vectorSearch.service.js";
import { generateAnswer } from "../services/llm.service.js";
import { refundMonthlyUsage } from "../services/usage.service.js";

// Minimum similarity score required
const RELEVANCE_THRESHOLD = 0.55;

// Prepare monthly usage information
const getUsageDetails = (req) => ({
  monthlyLimit: req.planLimit,
  messagesUsed: req.monthlyUsage,
  messagesRemaining: Math.max(
    0,
    req.planLimit - req.monthlyUsage
  ),
});

export const searchKnowledge = async (req, res) => {
  try {
    const { query } = req.body;

    // Step 1: Retrieve relevant knowledge
    const results = await searchRelevantChunks(
      query.trim(),
      req.tenantId
    );

    // Step 2: Filter irrelevant chunks
    const relevantResults = results.filter(
      (item) => item.score >= RELEVANCE_THRESHOLD
    );

    // Step 3: Return if no relevant knowledge is found
    if (!relevantResults.length) {
      return res.status(200).json({
        success: true,
        answer:
          "I could not find this information in the available knowledge.",
        sources: [],
        usage: getUsageDetails(req),
      });
    }

    // Step 4: Prepare context
    const context = relevantResults
      .map((item) => item.text)
      .join("\n\n");

    // Step 5: Generate AI answer using Groq
    const answer = await generateAnswer(
      query.trim(),
      context
    );

    return res.status(200).json({
      success: true,
      answer,
      sources: relevantResults.map((item) => ({
        sourceName: item.sourceName,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        score: item.score,
      })),
      usage: getUsageDetails(req),
    });
  } catch (error) {
    console.error("Chat Error:", error);

    try {
      // Refund usage if chat processing fails
      await refundMonthlyUsage(req.tenantId);
    } catch (refundError) {
      console.error("Usage Refund Error:", refundError);
    }

    return res.status(500).json({
      success: false,
      message: "Unable to generate an answer",
    });
  }
};
