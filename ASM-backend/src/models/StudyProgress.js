const mongoose = require("mongoose");

const studyProgressSchema = new mongoose.Schema(
  {
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
    status: {
      type: String,
      enum: ["new", "learning", "review", "mastered"],
      default: "new",
    },
    last_result: {
      type: String,
      enum: ["again", "hard", "good", "easy"],
      default: "again",
    },
    correct_count: { type: Number, default: 0, min: 0 },
    incorrect_count: { type: Number, default: 0, min: 0 },
    stability: { type: Number, default: 1 },
    difficulty: { type: Number, default: 1 },
    last_review_at: { type: Date, default: null },
    next_review_at: { type: Date, default: null },
  },
  {
    collection: "study_progress",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

studyProgressSchema.index({ user_id: 1, card_id: 1 }, { unique: true });

module.exports = mongoose.models.StudyProgress || mongoose.model("StudyProgress", studyProgressSchema);
