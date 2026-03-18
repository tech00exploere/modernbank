const express = require("express");
const { authRequired } = require("../middleware/auth");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { makeRef, round2 } = require("../utils");

const router = express.Router();

const mapTransaction = (doc) => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  accountNo: doc.accountNo,
  referenceId: doc.referenceId,
  type: doc.type,
  description: doc.description,
  currency: doc.currency,
  counterpartyAccount: doc.counterpartyAccount,
  amount: Number(doc.amount),
  balanceAfter: Number(doc.balanceAfter),
  status: doc.status,
  meta: doc.meta,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

router.get("/", authRequired, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(Math.max(1, Number(req.query.limit || 20)), 100);

  const query = { accountNo: req.user.accountNo };
  if (req.query.type) query.type = String(req.query.type).toUpperCase();
  if (req.query.status) query.status = String(req.query.status).toUpperCase();

  if (req.query.dateFrom || req.query.dateTo) {
    query.createdAt = {};
    if (req.query.dateFrom) query.createdAt.$gte = new Date(String(req.query.dateFrom));
    if (req.query.dateTo) query.createdAt.$lte = new Date(String(req.query.dateTo));
  }

  const [rows, total] = await Promise.all([
    Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(query),
  ]);

  return res.json({
    transactions: rows.map(mapTransaction),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

router.post("/", authRequired, async (req, res) => {
  const { type, amount } = req.body || {};
  const parsedAmount = Number(amount);

  if (!type || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const normalizedType = String(type).toUpperCase();
  if (!["DEPOSIT", "WITHDRAW"].includes(normalizedType)) {
    return res.status(400).json({ message: "Unsupported transaction type" });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "Account not found" });

  if (normalizedType === "WITHDRAW" && user.balance < parsedAmount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  user.balance = round2(
    normalizedType === "DEPOSIT" ? user.balance + parsedAmount : user.balance - parsedAmount
  );
  await user.save();

  const transaction = await Transaction.create({
    accountNo: user.accountNo,
    referenceId: makeRef("TXN"),
    type: normalizedType,
    description: normalizedType === "DEPOSIT" ? "Cash deposit" : "Cash withdrawal",
    currency: "INR",
    amount: parsedAmount,
    balanceAfter: user.balance,
    status: "COMPLETED",
    meta: {},
  });
  return res.status(201).json({
    message: "Transaction completed",
    balance: Number(user.balance),
    transaction: mapTransaction(transaction),
  });
});

router.post("/transfer", authRequired, async (req, res) => {
  const { toAccount, amount } = req.body || {};
  const parsedAmount = Number(amount);

  if (!toAccount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Missing fields" });
  }
  if (toAccount === req.user.accountNo) {
    return res.status(400).json({ message: "Cannot transfer to same account" });
  }

  const sender = await User.findById(req.user.id);
  if (!sender) return res.status(404).json({ message: "Account not found" });
  if (sender.balance < parsedAmount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const receiver = await User.findOne({ accountNo: String(toAccount).trim() });
  if (!receiver) return res.status(404).json({ message: "Destination account not found" });

  sender.balance = round2(sender.balance - parsedAmount);
  receiver.balance = round2(receiver.balance + parsedAmount);

  await Promise.all([sender.save(), receiver.save()]);

  const transferOutRef = makeRef("TRFOUT");
  const transferInRef = makeRef("TRFIN");

  await Transaction.insertMany([
    {
      accountNo: sender.accountNo,
      referenceId: transferOutRef,
      type: "TRANSFER_OUT",
      description: "Transfer to account",
      currency: "INR",
      counterpartyAccount: toAccount,
      amount: parsedAmount,
      balanceAfter: sender.balance,
      status: "COMPLETED",
      meta: { toAccount },
    },
    {
      accountNo: toAccount,
      referenceId: transferInRef,
      type: "TRANSFER_IN",
      description: "Transfer received",
      currency: "INR",
      counterpartyAccount: sender.accountNo,
      amount: parsedAmount,
      balanceAfter: receiver.balance,
      status: "COMPLETED",
      meta: { fromAccount: sender.accountNo },
    },
  ]);

  return res.status(201).json({
    message: "Transfer completed",
    balance: Number(sender.balance),
    transfer: {
      amount: parsedAmount,
      sender: {
        accountNo: sender.accountNo,
        balance: Number(sender.balance),
        referenceId: transferOutRef,
      },
      receiver: {
        accountNo: toAccount,
        balance: Number(receiver.balance),
        referenceId: transferInRef,
      },
    },
  });
});

module.exports = router;
