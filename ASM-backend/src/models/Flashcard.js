const mongoose = require("mongoose");

const flashcardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    language_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Language",
      required: [true, "language_id is required"],
    },
    topic_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: [true, "topic_id is required"],
    },
    level_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Level",
      required: [true, "level_id is required"],
    },
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, default: "", trim: true },
    tag_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tag" }],
    approval_status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
  },
  {
    collection: "flashcards",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

flashcardSchema.index({ name: "text", description: "text" });
flashcardSchema.index({ visibility: 1, approval_status: 1 });
flashcardSchema.index({ user_id: 1 });

module.exports = mongoose.models.Flashcard || mongoose.model("Flashcard", flashcardSchema);
