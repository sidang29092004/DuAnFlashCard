const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    flashcard_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flashcard",
      required: [true, "flashcard_id is required"],
    },
    front: { type: String, required: [true, "front is required"], trim: true },
    front_img: { type: String, default: "", trim: true },
    back: { type: String, required: [true, "back is required"], trim: true },
    back_img: { type: String, default: "", trim: true },
    color: { type: String, default: "#ffffff", trim: true },
    position: { type: Number, default: 0 },
  },
  {
    collection: "cards",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

cardSchema.index({ flashcard_id: 1 });
cardSchema.index({ flashcard_id: 1, position: 1, created_at: 1 });

module.exports = mongoose.models.Card || mongoose.model("Card", cardSchema);
