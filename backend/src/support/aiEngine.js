const { knowledgeBase } = require("./knowledgeBase");

function getKnowledgeSuggestions(message) {
  const text = String(message || "").toLowerCase();

  return knowledgeBase
    .filter((item) => item.keywords.some((keyword) => text.includes(keyword)))
    .slice(0, 3)
    .map((item) => ({ topic: item.topic, answer: item.answer }));
}

function buildFallbackReply(message, userName) {
  const suggestions = getKnowledgeSuggestions(message);

  if (suggestions.length === 0) {
    return {
      reply: `Hi ${userName || "there"}, I can help with account status, transfers, transactions, and loans. Please share more detail about your issue.`,
      suggestions: [],
      source: "fallback",
    };
  }

  const merged = suggestions
    .map((item, index) => `${index + 1}. ${item.topic}: ${item.answer}`)
    .join("\n");

  return {
    reply: `I found the following guidance:\n${merged}`,
    suggestions,
    source: "fallback",
  };
}

async function askOpenAI({ message, history, userName }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a banking customer-care assistant. Give concise, safe answers and include practical next steps.",
        },
        ...safeHistory,
        { role: "user", content: `Customer(${userName || "User"}): ${message}` },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`);
  }

  const payload = await response.json();
  const reply = payload?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw new Error("Empty response from OpenAI");
  }

  return {
    reply,
    suggestions: getKnowledgeSuggestions(message),
    source: "openai",
  };
}

async function generateSupportReply({ message, history, user }) {
  const userName = user?.name || user?.email || "Customer";

  try {
    const aiReply = await askOpenAI({ message, history, userName });
    if (aiReply) {
      return aiReply;
    }
  } catch (error) {
    return {
      ...buildFallbackReply(message, userName),
      warning: error.message,
    };
  }

  return buildFallbackReply(message, userName);
}

module.exports = { generateSupportReply };
