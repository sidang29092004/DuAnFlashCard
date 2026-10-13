const Card = require("../models/Card");
const Flashcard = require("../models/Flashcard");
const SavedFlashcard = require("../models/SavedFlashcard");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId } = require("../utils/validators");
const { canViewFlashcard } = require("../services/flashcardAccess");

const POPULATE_FLASHCARD = {
  path: "flashcard_id",
  populate: [
    { path: "user_id", select: "name email role" },
    { path: "language_id" },
    { path: "topic_id" },
    { path: "level_id" },
    { path: "tag_ids" },
  ],
};

async function attachCardCounts(savedItems) {
  const flashcardIds = savedItems
    .map((item) => item.flashcard_id?._id)
    .filter(Boolean);
  const counts = await Card.aggregate([
    { $match: { flashcard_id: { $in: flashcardIds } } },
    { $group: { _id: "$flashcard_id", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

  return savedItems.map((item) => {
    const data = item.toObject();
    if (data.flashcard_id) {
      data.flashcard_id.cards_count = countMap.get(data.flashcard_id._id.toString()) || 0;
      data.flashcard = data.flashcard_id;
    }
    return data;
  });
}

const saveFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.flashcardId, "flashcardId");

  const flashcard = await Flashcard.findById(req.params.flashcardId);
  if (!flashcard) throw new ApiError(404, "Flashcard not found");
  if (!canViewFlashcard(flashcard, req.user)) throw new ApiError(403, "Forbidden");

  try {
    const saved = await SavedFlashcard.create({
      user_id: req.user._id,
      flashcard_id: flashcard._id,
    });

    sendSuccess(res, { saved }, "Save flashcard successfully", 201);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(409, "Flashcard already saved");
    }
    throw error;
  }
});

const unsaveFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.flashcardId, "flashcardId");

  await SavedFlashcard.deleteOne({
    user_id: req.user._id,
    flashcard_id: req.params.flashcardId,
  });

  sendSuccess(res, {}, "Unsave flashcard successfully");
});

const getSavedFlashcards = asyncHandler(async (req, res) => {
  const savedItems = await SavedFlashcard.find({ user_id: req.user._id })
    .populate(POPULATE_FLASHCARD)
    .sort({ saved_at: -1 });

  sendSuccess(res, { saved_flashcards: await attachCardCounts(savedItems) }, "Get saved flashcards successfully");
});

module.exports = {
  getSavedFlashcards,
  saveFlashcard,
  unsaveFlashcard,
};
