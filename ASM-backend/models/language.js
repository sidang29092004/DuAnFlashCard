const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const language = new Schema({
  id: { type: ObjectId },
  name: { type: String },
  status: { type: String },
});

module.exports = mongoose.models.language || mongoose.model("language", language, "language");
