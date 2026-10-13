const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user_id is required"],
    },
    name: { type: String, required: [true, "name is required"], trim: true },
    description: { type: String, default: "", trim: true },
  },
  {
    collection: "tags",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    versionKey: false,
  },
);

tagSchema.index({ user_id: 1, name: 1 });

module.exports = mongoose.models.Tag || mongoose.model("Tag", tagSchema);
