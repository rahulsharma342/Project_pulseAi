
import express from "express";
import { searchKnowledge } from "../controllers/chat.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { attachTenant } from "../middleware/tenant.middleware.js";
import chatRateLimiter from "../middleware/rateLimit.middleware.js";
import checkUsageLimit from "../middleware/usage.middleware.js";
import validateChatQuery from "../middleware/validateChat.middleware.js";

const router = express.Router();

// Authentication → Tenant → Rate Limit → Monthly Usage → AI Chat
router.post(
  "/search",
  protect,
  attachTenant,
  validateChatQuery, // Validate query before consuming usage
  chatRateLimiter,
  checkUsageLimit,
  searchKnowledge
);

export default router;
