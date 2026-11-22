import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import knowledgeRoutes from "./routes/knowledge.routes.js";
import chatRoutes from './routes/chat.routes.js';
import usageRoutes from "./routes/usage.routes.js";

dotenv.config();

const app = express();


// Allow frontend to communicate with backend using cookies
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
// Chat and knowledge search APIs
app.use('/api/chat', chatRoutes);

app.use("/api/auth", authRoutes);
// Knowledge source APIs
app.use("/api/knowledge", knowledgeRoutes);
// Monthly usage and subscription statistics
app.use("/api/usage", usageRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

export default app;
