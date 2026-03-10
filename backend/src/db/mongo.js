const mongoose = require("mongoose");

const connectMongo = async () => {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bank_mgmt";
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
};

module.exports = { connectMongo, mongoose };
