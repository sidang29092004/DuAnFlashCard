const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const flashcard = new Schema({
  id: { type: ObjectId }, //khóa chính
  id_user: { type: ObjectId, ref: "user" },
  id_language: { type: ObjectId, ref: "language" },
  id_topic: { type: ObjectId, ref: "topic" },
  id_level: { type: ObjectId, ref: "level" },
  Description: { type: String },
  name: { type: String },
  approval_status: { type: String },
  visibility: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.models.flashcard || mongoose.model("flashcard", flashcard, "flashcard");
