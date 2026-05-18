const { Schema, model } = require("mongoose");

const transactionSchema = new Schema(
  {
    accountNo: { type: String, required: true, index: true },
    referenceId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    counterpartyAccount: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["PENDING", "COMPLETED", "FAILED"], default: "COMPLETED" },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);
transactionSchema.index({ accountNo: 1, createdAt: -1 });
module.exports = model("Transaction", transactionSchema);
