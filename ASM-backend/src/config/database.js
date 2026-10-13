const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flashcard_db";

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

  console.log("Connected to MongoDB");
}

module.exports = connectDatabase;
