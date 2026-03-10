const express = require("express");
const { authRequired } = require("../middleware/auth");
const User = require("../models/User");
const Loan = require("../models/Loan");
const Transaction = require("../models/Transaction");
const { makeRef, round2, addMonths } = require("../utils");

const router = express.Router();

const calculateMonthlyEmi = (principal, annualRate, tenureMonths) => {
  const p = Number(principal);
  const n = Number(tenureMonths);
  const r = Number(annualRate) / 12 / 100;
  if (r === 0) return round2(p / n);
  const factor = Math.pow(1 + r, n);
  return round2((p * r * factor) / (factor - 1));
};

const deriveCreditScore = (annualIncome, loanAmount, tenureMonths) => {
  const income = Math.max(0, Number(annualIncome));
  const amount = Math.max(1, Number(loanAmount));
  const tenure = Math.max(1, Number(tenureMonths));
  const affordability = income / amount;
  const tenureSupport = Math.min(1.1, tenure / 24);
  const raw = 520 + affordability * 120 + tenureSupport * 80;
  return Math.max(300, Math.min(900, Math.round(raw)));
};

const mapLoan = (doc) => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  userId: doc.userId,
  accountNo: doc.accountNo,
  principalAmount: Number(doc.principalAmount),
  annualIncome: Number(doc.annualIncome),
  tenureMonths: doc.tenureMonths,
  purpose: doc.purpose,
  interestRateAnnual: Number(doc.interestRateAnnual),
  monthlyEmi: Number(doc.monthlyEmi),
  totalPayable: Number(doc.totalPayable),
  totalPaid: Number(doc.totalPaid),
  remainingPrincipal: Number(doc.remainingPrincipal),
  paidInstallments: doc.paidInstallments,
  creditScore: doc.creditScore,
  status: doc.status,
  disbursedAt: doc.disbursedAt,
  nextDueDate: doc.nextDueDate,
  lastPaymentAt: doc.lastPaymentAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

router.get("/", authRequired, async (req, res) => {
  const rows = await Loan.find({ accountNo: req.user.accountNo }).sort({ createdAt: -1 });
  return res.json({ loans: rows.map(mapLoan) });
});

router.get("/:loanId", authRequired, async (req, res) => {
  const loan = await Loan.findOne({ _id: req.params.loanId, accountNo: req.user.accountNo });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found" });
  }
  return res.json({ loan: mapLoan(loan) });
});

router.post("/apply", authRequired, async (req, res) => {
  const { loanAmount, tenureMonths, annualIncome, purpose } = req.body || {};
  const parsedLoanAmount = Number(loanAmount);
  const parsedTenure = Number(tenureMonths);
  const parsedIncome = Number(annualIncome);

  if (
    !Number.isFinite(parsedLoanAmount) ||
    !Number.isFinite(parsedTenure) ||
    !Number.isFinite(parsedIncome) ||
    parsedLoanAmount <= 0 ||
    parsedTenure <= 0 ||
    parsedIncome < 0
  ) {
    return res.status(400).json({ message: "Invalid loan application fields" });
  }

  const activeCheck = await Loan.exists({
    accountNo: req.user.accountNo,
    status: { $in: ["APPROVED", "ACTIVE"] },
  });
  if (activeCheck) {
    return res.status(409).json({ message: "An active loan already exists for this account" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Account not found" });

  const interestRateAnnual = 12;
  const monthlyEmi = calculateMonthlyEmi(parsedLoanAmount, interestRateAnnual, parsedTenure);
  const totalPayable = round2(monthlyEmi * parsedTenure);
  const creditScore = deriveCreditScore(parsedIncome, parsedLoanAmount, parsedTenure);

  if (creditScore < 560) {
    const rejected = await Loan.create({
      userId: user._id,
      accountNo: user.accountNo,
      principalAmount: parsedLoanAmount,
      annualIncome: parsedIncome,
      tenureMonths: parsedTenure,
      purpose: String(purpose || "").trim(),
      interestRateAnnual,
      monthlyEmi,
      totalPayable,
      totalPaid: 0,
      remainingPrincipal: parsedLoanAmount,
      paidInstallments: 0,
      creditScore,
      status: "REJECTED",
    });

    return res.status(201).json({
      message: "Loan application rejected based on eligibility",
      loan: mapLoan(rejected),
    });
  }

  user.balance = round2(user.balance + parsedLoanAmount);
  const loan = await Loan.create({
    userId: user._id,
    accountNo: user.accountNo,
    principalAmount: parsedLoanAmount,
    annualIncome: parsedIncome,
    tenureMonths: parsedTenure,
    purpose: String(purpose || "").trim(),
    interestRateAnnual,
    monthlyEmi,
    totalPayable,
    totalPaid: 0,
    remainingPrincipal: parsedLoanAmount,
    paidInstallments: 0,
    creditScore,
    status: "ACTIVE",
    disbursedAt: new Date(),
    nextDueDate: addMonths(new Date(), 1),
  });

  await Promise.all([
    user.save(),
    Transaction.create({
      accountNo: user.accountNo,
      referenceId: makeRef("LOAN"),
      type: "LOAN_CREDIT",
      description: "Loan amount disbursed",
      currency: "INR",
      amount: parsedLoanAmount,
      balanceAfter: Number(user.balance),
      status: "COMPLETED",
      meta: { loanId: loan._id.toString() },
    }),
  ]);

  return res.status(201).json({
    message: "Loan approved and credited to account",
    loan: mapLoan(loan),
    balance: Number(user.balance),
  });
});

router.post("/:loanId/pay-emi", authRequired, async (req, res) => {
  const requestedAmount = Number(req.body?.amount);

  const loan = await Loan.findOne({ _id: req.params.loanId, accountNo: req.user.accountNo });
  if (!loan) {
    return res.status(404).json({ message: "Loan not found" });
  }

  if (!["APPROVED", "ACTIVE"].includes(loan.status)) {
    return res.status(400).json({ message: "EMI payment allowed only for active loans" });
  }

  if (loan.paidInstallments >= loan.tenureMonths || loan.remainingPrincipal <= 0) {
    loan.status = "CLOSED";
    loan.nextDueDate = null;
    await loan.save();
    return res.status(400).json({ message: "Loan is already closed" });
  }

  const dueAmount = round2(Math.min(loan.monthlyEmi, loan.remainingPrincipal));
  const payAmount = Number.isFinite(requestedAmount) && requestedAmount > 0 ? round2(requestedAmount) : dueAmount;

  if (payAmount < dueAmount) {
    return res.status(400).json({ message: `Minimum EMI due is ${dueAmount}` });
  }

  const user = await User.findById(req.user.id);
  if (!user || user.balance < payAmount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  user.balance = round2(user.balance - payAmount);

  loan.totalPaid = round2(loan.totalPaid + payAmount);
  loan.remainingPrincipal = round2(Math.max(0, loan.remainingPrincipal - payAmount));
  loan.paidInstallments = Math.min(loan.tenureMonths, loan.paidInstallments + 1);
  loan.lastPaymentAt = new Date();

  const isClosed = loan.remainingPrincipal <= 0 || loan.paidInstallments >= loan.tenureMonths;
  loan.status = isClosed ? "CLOSED" : "ACTIVE";
  loan.nextDueDate = isClosed ? null : addMonths(new Date(), 1);

  await Promise.all([
    user.save(),
    loan.save(),
    Transaction.create({
      accountNo: req.user.accountNo,
      referenceId: makeRef("EMI"),
      type: "EMI_PAYMENT",
      description: "Loan EMI payment",
      currency: "INR",
      amount: payAmount,
      balanceAfter: Number(user.balance),
      status: "COMPLETED",
      meta: { loanId: loan._id.toString(), installment: loan.paidInstallments },
    }),
  ]);

  return res.json({
    message: "EMI paid successfully",
    loan: mapLoan(loan),
    balance: Number(user.balance),
    paidAmount: payAmount,
  });
});

module.exports = router;
