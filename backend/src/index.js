const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const { connectMongo } = require("./db/mongo");
const authRoutes = require("./routes/auth");
const accountRoutes = require("./routes/accounts");
const transactionRoutes = require("./routes/transactions");
const loanRoutes = require("./routes/loans");
const healthRoutes = require("./routes/health");
const supportRoutes = require("./support/routes");
const callSupportRoutes = require("./routes/callSupport");

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      process.env.FRONTEND_URL ||
      "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 8 * 60 * 60 * 1000,
    },
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Modern Bank backend online" });
});

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/transactions", transactionRoutes);
app.use("/loans", loanRoutes);
app.use("/support", supportRoutes);
app.use("/call-support", callSupportRoutes);

const start = async () => {
  await connectMongo();
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

