const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { makeRef } = require("../utils");

const router = express.Router();

const issueTokens = (user, req, res) => {
  const userId = user.id || (user._id ? user._id.toString() : "");
  const payload = {
    id: userId,
    email: user.email,
    role: user.role,
    accountNo: user.accountNo,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "8h",
  });
  req.session.user = payload;
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  });
};

const generateAccountNo = () =>
  `AB-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
    1000 + Math.random() * 9000
  )}`;

const createUniqueAccountNo = async () => {
  for (let i = 0; i < 20; i += 1) {
    const accountNo = generateAccountNo();
    const existing = await User.exists({ accountNo });
    if (!existing) return accountNo;
  }
  throw new Error("Failed to generate unique account number");
};

const googleConfig = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || `${backendUrl}/auth/google/callback`;

  return { clientId, clientSecret, redirectUri };
};

const ensureGoogleConfigured = () => {
  const { clientId, clientSecret, redirectUri } = googleConfig();
  if (!clientId || !clientSecret || !redirectUri) return null;
  return { clientId, clientSecret, redirectUri };
};

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

const createInitialDeposit = async (user, amount = 5000) => {
  await Transaction.create({
    accountNo: user.accountNo,
    referenceId: makeRef("OPEN"),
    type: "INITIAL_DEPOSIT",
    description: "Opening balance",
    currency: "INR",
    amount,
    balanceAfter: amount,
    status: "COMPLETED",
    meta: { note: "Opening balance" },
  });
};

const findOrCreateGoogleUser = async ({ email, name }) => {
  const existing = await User.findOne({ email }).lean();
  if (existing) {
    return mapUser(existing);
  }

  const passwordHash = await bcrypt.hash(randomUUID(), 10);
  const accountNo = await createUniqueAccountNo();

  const user = await User.create({
    name: name || email.split("@")[0] || "Google User",
    email,
    passwordHash,
    accountNo,
    phone: "",
    governmentId: "",
    balance: 5000,
    status: "PENDING",
    role: "USER",
  });

  await createInitialDeposit(user, 5000);
  return mapUser(user);
};

router.post("/register", async (req, res) => {
  const { name, email, password, phone, governmentId } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = await User.exists({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const accountNo = await createUniqueAccountNo();

  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    accountNo,
    phone: String(phone || "").trim(),
    governmentId: String(governmentId || "").trim(),
    balance: 5000,
    status: "PENDING",
    role: "USER",
  });

  await createInitialDeposit(user, 5000);

  return res.status(201).json({
    message: "Account created. Pending admin verification.",
    user: mapUser(user),
  });
});

router.get("/google/start", async (req, res) => {
  const config = ensureGoogleConfigured();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  if (!config) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }

  const state = randomUUID();
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return req.session.save((error) => {
    if (error) {
      return res.redirect(`${frontendUrl}/login?error=google_session_save_failed`);
    }
    return res.redirect(authUrl);
  });
});

router.get("/google/callback", async (req, res) => {
  const config = ensureGoogleConfigured();
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  if (!config) {
    return res.redirect(`${frontendUrl}/login?error=google_not_configured`);
  }

  const code = String(req.query.code || "");
  const state = String(req.query.state || "");
  if (!code || !state || state !== req.session.oauthState) {
    return res.redirect(`${frontendUrl}/login?error=google_oauth_state`);
  }

  delete req.session.oauthState;

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      return res.redirect(
        `${frontendUrl}/login?error=google_token_exchange&status=${tokenResponse.status}`
      );
    }

    const tokenPayload = await tokenResponse.json();
    if (!tokenPayload.id_token) {
      return res.redirect(`${frontendUrl}/login?error=google_missing_id_token`);
    }

    const verifyResponse = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
        tokenPayload.id_token
      )}`
    );
    if (!verifyResponse.ok) {
      return res.redirect(`${frontendUrl}/login?error=google_token_verify`);
    }

    const profile = await verifyResponse.json();
    if (!profile?.email || profile.aud !== config.clientId) {
      return res.redirect(`${frontendUrl}/login?error=google_profile_invalid`);
    }

    const user = await findOrCreateGoogleUser({
      email: String(profile.email).toLowerCase(),
      name: String(profile.name || "").trim(),
    });

    issueTokens(user, req, res);
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("Google OAuth callback failed:", error);
    return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const user = await User.findOne({ email: String(email).trim().toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  issueTokens(mapUser(user), req, res);
  return res.json({
    message: "Signed in",
    user: mapUser(user),
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("token");
    res.clearCookie("connect.sid");
    return res.json({ message: "Signed out" });
  });
});

module.exports = router;
