const mongoose = require("mongoose");

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "name is required"], trim: true },
    code: { type: String, required: [true, "code is required"], trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  {
    collection: "languages",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

module.exports = mongoose.models.Language || mongoose.model("Language", languageSchema);
