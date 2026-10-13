const mongoose = require("mongoose");

const studyHistorySchema = new mongoose.Schema(
  {
    study_progress_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StudyProgress",
      required: [true, "study_progress_id is required"],
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    card_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      required: [true, "card_id is required"],
    },
    result: {
      type: String,
      enum: ["correct", "incorrect"],
      required: [true, "result is required"],
    },
    rating: {
      type: String,
      enum: ["again", "hard", "good", "easy"],
      required: [true, "rating is required"],
    },
    reviewed_at: { type: Date, default: Date.now },
  },
  {
    collection: "study_history",
    versionKey: false,
  },
);

studyHistorySchema.index({ user_id: 1, card_id: 1, reviewed_at: -1 });

module.exports = mongoose.models.StudyHistory || mongoose.model("StudyHistory", studyHistorySchema);
