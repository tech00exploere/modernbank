const express = require("express");
const { authRequired } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

const mapUser = (doc) => ({
  id: doc._id.toString(),
  name: doc.name,
  email: doc.email,
  phone: doc.phone,
  governmentId: doc.governmentId,
  role: doc.role,
  status: doc.status,
  accountNo: doc.accountNo,
  balance: Number(doc.balance),
  createdAt: doc.createdAt,
});

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: mapUser(user) });
});

router.put("/me", authRequired, async (req, res) => {
  const { name, phone, governmentId } = req.body || {};
  const updates = {};

  if (name !== undefined) {
    const cleanName = String(name).trim();
    if (!cleanName) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }
    updates.name = cleanName;
  }

  if (phone !== undefined) {
    updates.phone = String(phone).trim();
  }

  if (governmentId !== undefined) {
    updates.governmentId = String(governmentId).trim();
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields provided for update" });
  }
  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ message: "Profile updated", user: mapUser(user) });
});

module.exports = router;
