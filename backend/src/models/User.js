const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, default: "" },
    governmentId: { type: String, default: "" },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    status: { type: String, enum: ["PENDING", "ACTIVE", "SUSPENDED"], default: "PENDING" },
    accountNo: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 5000, min: 0 },
    googleId: { type: String, default: "" }
  },
  { timestamps: true }
);
module.exports = model("User", userSchema);
