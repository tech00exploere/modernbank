const express = require("express");
const { authRequired } = require("../middleware/auth");
const { generateSupportReply } = require("./aiEngine");

const router = express.Router();

router.get("/health", (req, res) => {
  return res.json({
    ok: true,
    service: "support",
    mode: process.env.OPENAI_API_KEY ? "openai+fallback" : "fallback-only",
    timestamp: new Date().toISOString(),
  });
});

router.post("/chat", authRequired, async (req, res) => {
  const { message, history } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ message: "A text message is required" });
  }

  const result = await generateSupportReply({
    message,
    history,
    user: req.user,
  });

  return res.json({
    reply: result.reply,
    suggestions: result.suggestions,
    source: result.source,
    warning: result.warning || null,
  });
});

module.exports = router;
