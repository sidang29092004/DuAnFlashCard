const express = require("express");
const cors = require("cors");
const logger = require("morgan");
const path = require("path");

require("./models");

const adminRoutes = require("./routes/adminRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const authRoutes = require("./routes/authRoutes");
const cardRoutes = require("./routes/cardRoutes");
const flashcardRoutes = require("./routes/flashcardRoutes");
const importRoutes = require("./routes/importRoutes");
const languageRoutes = require("./routes/languageRoutes");
const levelRoutes = require("./routes/levelRoutes");
const savedRoutes = require("./routes/savedRoutes");
const studyRoutes = require("./routes/studyRoutes");
const tagRoutes = require("./routes/tagRoutes");
const topicRoutes = require("./routes/topicRoutes");
const { errorMiddleware, notFoundMiddleware } = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(logger("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to Flashcard API",
    data: {
      health: "/api/health",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    data: {},
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/import", importRoutes);
app.use("/api/saved", savedRoutes);
app.use("/api/study", studyRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
