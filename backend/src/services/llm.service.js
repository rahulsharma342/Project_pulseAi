
import Groq from "groq-sdk";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Generate an answer using retrieved knowledge
export const generateAnswer = async (query, context) => {
  if (!query || typeof query !== "string") {
    throw new Error("Valid query is required");
  }

  if (!context || !context.trim()) {
    throw new Error("Knowledge context is required");
  }

  console.log("Sending request to Groq...");

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content: `You are a helpful customer support assistant.
Answer the user's question using ONLY the provided knowledge.
Do not make up information.
If the answer is unavailable, say:
"I could not find this information in the available knowledge."
Keep your answer clear and concise.`,
      },
      {
        role: "user",
        content: `Knowledge:
${context}

User Question:
${query}`,
      },
    ],
    temperature: 0.2,
  });

  console.log("Groq response received!");

  return response.choices[0].message.content;
};
