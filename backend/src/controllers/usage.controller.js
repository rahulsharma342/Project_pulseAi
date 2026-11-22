
import Tenant from "../models/tenant.model.js";
import { getMonthlyUsage } from "../services/usage.service.js";
import PLAN_LIMITS from "../config/planLimits.js";

// Get monthly usage details for the authenticated tenant
export const getUsageStats = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.tenantId).select("plan");

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const usage = await getMonthlyUsage(req.tenantId);
    const limit = PLAN_LIMITS[tenant.plan];

    return res.status(200).json({
      success: true,
      plan: tenant.plan,
      monthlyLimit: limit,
      messagesUsed: usage.messageCount,
      messagesRemaining: Math.max(0, limit - usage.messageCount),
    });
  } catch (error) {
    console.error("Usage Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch usage statistics",
    });
  }
};
