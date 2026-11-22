
import express from "express";
import { getUsageStats } from "../controllers/usage.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { attachTenant } from "../middleware/tenant.middleware.js";

const router = express.Router();

// Get monthly usage for the authenticated tenant
router.get("/", protect, attachTenant, getUsageStats);

export default router;
