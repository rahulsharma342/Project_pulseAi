
import rateLimit from "express-rate-limit";

// Give each tenant an independent request limit
const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,

  // Identify requests using the authenticated tenant ID
  keyGenerator: (req) => req.tenantId.toString(),

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many requests. Please try again after one minute.",
  },
});

export default chatRateLimiter;
