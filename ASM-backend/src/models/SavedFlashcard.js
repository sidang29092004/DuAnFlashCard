const mongoose = require("mongoose");

const savedFlashcardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    flashcard_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flashcard",
      required: [true, "flashcard_id is required"],
    },
    saved_at: { type: Date, default: Date.now },
  },
  {
    collection: "saved_flashcards",
    versionKey: false,
  },
);

savedFlashcardSchema.index({ user_id: 1, flashcard_id: 1 }, { unique: true });

module.exports = mongoose.models.SavedFlashcard || mongoose.model("SavedFlashcard", savedFlashcardSchema);
