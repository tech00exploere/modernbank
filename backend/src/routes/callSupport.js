const express = require("express");
const twilio = require("twilio");

const { authRequired } = require("../middleware/auth");
const { generateSupportReply } = require("../support/aiEngine");

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;
router.use(express.urlencoded({ extended: false }));

router.post("/voice", async (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: ["speech"],
    action: "/call-support/handle-speech",
    method: "POST",
    speechTimeout: "auto",
  });

  gather.say(
    { voice: "alice" },
    "Welcome to Modern Bank AI support. Please tell me your issue after the beep."
  );

  twiml.redirect({ method: "POST" }, "/call-support/voice");

  res.type("text/xml");
  return res.send(twiml.toString());
});

router.post("/handle-speech", async (req, res) => {
  const twiml = new VoiceResponse();
  const speechText = String(req.body?.SpeechResult || "").trim();

  if (!speechText) {
    twiml.say({ voice: "alice" }, "I could not hear you clearly. Please try again.");
    twiml.redirect({ method: "POST" }, "/call-support/voice");
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  const result = await generateSupportReply({
    message: speechText,
    history: [],
    user: { name: "Caller" },
  });

  twiml.say({ voice: "alice" }, result.reply);
  twiml.say({ voice: "alice" }, "If you need more help, please say your next question.");
  twiml.redirect({ method: "POST" }, "/call-support/voice");

  res.type("text/xml");
  return res.send(twiml.toString());
});

router.post("/dial", authRequired, async (req, res) => {
  const to = String(req.body?.to || "").trim();

  if (!to) {
    return res.status(400).json({ message: "Phone number required" });
  }

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const baseUrl = process.env.PUBLIC_BASE_URL;

  if (!sid || !token || !from || !baseUrl) {
    return res.status(500).json({
      message:
        "Missing Twilio configuration. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, and PUBLIC_BASE_URL.",
    });
  }
  const client = twilio(sid, token);
  const call = await client.calls.create({
    to,
    from,
    url: `${baseUrl}/call-support/voice`,
  });

  return res.json({ message: "AI support call initiated", callSid: call.sid });
});

module.exports = router;
