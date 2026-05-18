const { Schema, model } = require("mongoose");

const loanSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    accountNo: { type: String, required: true, index: true },
    principalAmount: { type: Number, required: true, min: 1 },
    annualIncome: { type: Number, required: true, min: 0 },
    tenureMonths: { type: Number, required: true, min: 1 }, 
    purpose: { type: String, default: "" },
    interestRateAnnual: { type: Number, required: true, min: 0 },
    monthlyEmi: { type: Number, required: true, min: 0 },
    totalPayable: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, default: 0, min: 0 },
    remainingPrincipal: { type: Number, required: true, min: 0 },
    paidInstallments: { type: Number, default: 0, min: 0 },
    creditScore: { type: Number, required: true, min: 300, max: 900 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "ACTIVE", "CLOSED"], default: "PENDING" },
    disbursedAt: { type: Date, default: null },
    nextDueDate: { type: Date, default: null },
    lastPaymentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

loanSchema.index({ accountNo: 1, createdAt: -1 });
module.exports = model("Loan", loanSchema);
