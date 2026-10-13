const Card = require("../models/Card");
const Flashcard = require("../models/Flashcard");
const StudyHistory = require("../models/StudyHistory");
const StudyProgress = require("../models/StudyProgress");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId, assertRequired } = require("../utils/validators");
const { applyStudyRating } = require("../services/studyScheduler");
const { canViewFlashcard } = require("../services/flashcardAccess");

function mapStudyCard(card, progress) {
  return {
    _id: card._id,
    flashcard_id: card.flashcard_id,
    front: card.front,
    front_img: card.front_img,
    back: card.back,
    back_img: card.back_img,
    color: card.color,
    position: card.position,
    progress: progress || null,
  };
}

const getStudyCards = asyncHandler(async (req, res) => {
  assertObjectId(req.params.flashcardId, "flashcardId");

  const flashcard = await Flashcard.findById(req.params.flashcardId);
  if (!flashcard) throw new ApiError(404, "Flashcard not found");
  if (!canViewFlashcard(flashcard, req.user)) throw new ApiError(403, "Forbidden");

  const cards = await Card.find({ flashcard_id: flashcard._id }).sort({ position: 1, created_at: 1 });
  const cardIds = cards.map((card) => card._id);
  const progressList = await StudyProgress.find({ user_id: req.user._id, card_id: { $in: cardIds } });
  const progressByCard = new Map(progressList.map((progress) => [progress.card_id.toString(), progress.toObject()]));
  const now = new Date();
  const dueCards = cards.filter((card) => {
    const progress = progressByCard.get(card._id.toString());
    return !progress || !progress.next_review_at || new Date(progress.next_review_at) <= now;
  });

  sendSuccess(res, {
    flashcard,
    cards: dueCards.map((card) => mapStudyCard(card, progressByCard.get(card._id.toString()))),
    total_cards: cards.length,
  }, "Get study cards successfully");
});

const reviewCard = asyncHandler(async (req, res) => {
  const { card_id, rating } = req.body;
  const ratings = ["again", "hard", "good", "easy"];

  assertRequired(card_id, "card_id");
  assertObjectId(card_id, "card_id");

  if (!ratings.includes(rating)) {
    throw new ApiError(400, "rating is invalid");
  }

  const card = await Card.findById(card_id);
  if (!card) throw new ApiError(404, "Card not found");

  const flashcard = await Flashcard.findById(card.flashcard_id);
  if (!flashcard || !canViewFlashcard(flashcard, req.user)) {
    throw new ApiError(403, "Forbidden");
  }

  let progress = await StudyProgress.findOne({ user_id: req.user._id, card_id: card._id });
  if (!progress) {
    progress = new StudyProgress({
      user_id: req.user._id,
      card_id: card._id,
      status: "new",
    });
  }

  Object.assign(progress, applyStudyRating(progress, rating));
  await progress.save();

  const history = await StudyHistory.create({
    study_progress_id: progress._id,
    user_id: req.user._id,
    card_id: card._id,
    result: rating === "again" ? "incorrect" : "correct",
    rating,
  });

  sendSuccess(res, { progress, history }, "Review card successfully", 201);
});

const getProgress = asyncHandler(async (req, res) => {
  assertObjectId(req.params.flashcardId, "flashcardId");

  const flashcard = await Flashcard.findById(req.params.flashcardId);
  if (!flashcard) throw new ApiError(404, "Flashcard not found");
  if (!canViewFlashcard(flashcard, req.user)) throw new ApiError(403, "Forbidden");

  const cards = await Card.find({ flashcard_id: flashcard._id }).select("_id");
  const cardIds = cards.map((card) => card._id);
  const progressList = await StudyProgress.find({ user_id: req.user._id, card_id: { $in: cardIds } });
  const counts = {
    new_cards: Math.max(cards.length - progressList.length, 0),
    learning_cards: 0,
    review_cards: 0,
    mastered_cards: 0,
  };

  progressList.forEach((progress) => {
    if (progress.status === "learning") counts.learning_cards += 1;
    if (progress.status === "review") counts.review_cards += 1;
    if (progress.status === "mastered") counts.mastered_cards += 1;
    if (progress.status === "new") counts.new_cards += 1;
  });

  const studied = counts.learning_cards + counts.review_cards + counts.mastered_cards;

  sendSuccess(res, {
    total_cards: cards.length,
    ...counts,
    progress_percent: cards.length === 0 ? 0 : Math.round((studied / cards.length) * 100),
  }, "Get study progress successfully");
});

module.exports = {
  getProgress,
  getStudyCards,
  reviewCard,
};
