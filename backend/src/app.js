import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
// Import knowledge routes
import knowledgeRoutes from "./routes/knowledge.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
// Knowledge source APIs
app.use("/api/knowledge", knowledgeRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

export default app;
