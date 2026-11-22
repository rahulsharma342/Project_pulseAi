
import Tenant from "../models/tenant.model.js";
import { incrementMonthlyUsage } from "../services/usage.service.js";
import PLAN_LIMITS from "../config/planLimits.js";

const checkUsageLimit = async (req, res, next) => {
  try {
    // Find the authenticated tenant's subscription plan
    const tenant = await Tenant.findById(req.tenantId).select("plan");

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Get the monthly message limit
    const limit = PLAN_LIMITS[tenant.plan];

    if (limit === undefined) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // Increment usage only if the monthly limit is not reached
    const usage = await incrementMonthlyUsage(
      req.tenantId,
      limit
    );

    if (!usage) {
      return res.status(429).json({
        success: false,
        message: "Monthly message limit reached. Please upgrade your plan.",
      });
    }

    // Store updated usage for the chat controller
    req.planLimit = limit;
    req.monthlyUsage = usage.messageCount;

    next();
  } catch (error) {
    console.error("Usage Middleware Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check monthly usage",
    });
  }
};

export default checkUsageLimit;
