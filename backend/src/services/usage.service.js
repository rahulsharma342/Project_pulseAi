
import Usage from "../models/usage.model.js";

// Get the current month in YYYY-MM format
const getCurrentMonth = () => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

// Get or create monthly usage for a tenant
export const getMonthlyUsage = async (tenantId) => {
  const month = getCurrentMonth();

  const usage = await Usage.findOneAndUpdate(
    {
      tenantId,
      month,
    },
    {
      $setOnInsert: {
        tenantId,
        month,
        messageCount: 0,
      },
    },
    {
  returnDocument: "after",
  upsert: true,
}
  );

  return usage;
};

// Increment message count only if monthly limit is not reached
export const incrementMonthlyUsage = async (tenantId, limit) => {
  const month = getCurrentMonth();

  // Ensure monthly usage record exists
  await getMonthlyUsage(tenantId);

  // Atomically increment count if it is below the limit
  const usage = await Usage.findOneAndUpdate(
    {
      tenantId,
      month,
      messageCount: { $lt: limit },
    },
    {
      $inc: { messageCount: 1 },
    },
    {
  returnDocument: "after",
}
  );

  // Null means the monthly limit has been reached
  return usage;
};

// Refund one message if AI response generation fails
export const refundMonthlyUsage = async (tenantId) => {
  const month = getCurrentMonth();

  await Usage.findOneAndUpdate(
    {
      tenantId,
      month,
      messageCount: { $gt: 0 },
    },
    {
      $inc: { messageCount: -1 },
    }
  );
};