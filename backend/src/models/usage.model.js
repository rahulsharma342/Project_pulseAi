
import mongoose from "mongoose";

const usageSchema = new mongoose.Schema(
  {
    // Company whose usage is being tracked
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    // Monthly period in YYYY-MM format
    month: {
      type: String,
      required: true,
    },

    // Total AI messages used during this month
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// One usage record per tenant per month
usageSchema.index(
  { tenantId: 1, month: 1 },
  { unique: true }
);

const Usage = mongoose.model("Usage", usageSchema);

export default Usage;
