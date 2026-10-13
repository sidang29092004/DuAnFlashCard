const Card = require("../models/Card");
const Flashcard = require("../models/Flashcard");
const SavedFlashcard = require("../models/SavedFlashcard");
const StudyHistory = require("../models/StudyHistory");
const StudyProgress = require("../models/StudyProgress");
const Tag = require("../models/Tag");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId, assertRequired, isObjectId, pickAllowed } = require("../utils/validators");
const { canViewFlashcard, ensureOwner, ensureOwnerOrAdmin } = require("../services/flashcardAccess");
const { deleteCardImages } = require("../utils/fileUtils");

const FLASHCARD_FIELDS = ["name", "description", "language_id", "topic_id", "level_id", "tag_ids", "visibility"];
const POPULATE_OPTIONS = [
  { path: "user_id", select: "name email role" },
  { path: "language_id" },
  { path: "topic_id" },
  { path: "level_id" },
  { path: "tag_ids" },
];

function cleanFlashcardPayload(body) {
  const payload = pickAllowed(body, FLASHCARD_FIELDS);

  if (payload.visibility && !["private", "public"].includes(payload.visibility)) {
    throw new ApiError(400, "visibility is invalid");
  }

  ["language_id", "topic_id", "level_id"].forEach((field) => {
    if (payload[field] !== undefined) assertObjectId(payload[field], field);
  });

  if (payload.tag_ids !== undefined) {
    if (!Array.isArray(payload.tag_ids)) throw new ApiError(400, "tag_ids must be an array");
    payload.tag_ids.forEach((id) => assertObjectId(id, "tag_ids"));
    payload.tag_ids = [...new Set(payload.tag_ids.map(String))];
  }

  return payload;
}

async function assertOwnedTags(userId, tagIds = []) {
  if (!tagIds.length) return;

  const count = await Tag.countDocuments({
    _id: { $in: tagIds },
    user_id: userId,
  });

  if (count !== tagIds.length) {
    throw new ApiError(400, "tag_ids contains invalid tags");
  }
}

function cleanCardsPayload(cards) {
  if (cards === undefined) return [];
  if (!Array.isArray(cards)) throw new ApiError(400, "cards must be an array");

  return cards
    .map((card, index) => {
      const position = Number(card.position);
      return {
      front: String(card.front || "").trim(),
      back: String(card.back || "").trim(),
      front_img: String(card.front_img || "").trim(),
      back_img: String(card.back_img || "").trim(),
      color: String(card.color || "#ffffff").trim(),
      position: Number.isFinite(position) ? position : index,
    };
    })
    .filter((card) => card.front || card.back);
}

async function attachCardCounts(flashcards, user = null) {
  const ids = flashcards.map((item) => item._id);
  const [counts, savedItems] = await Promise.all([
    Card.aggregate([
      { $match: { flashcard_id: { $in: ids } } },
      { $group: { _id: "$flashcard_id", count: { $sum: 1 } } },
    ]),
    user ? SavedFlashcard.find({ user_id: user._id, flashcard_id: { $in: ids } }).select("flashcard_id") : [],
  ]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));
  const savedSet = new Set(savedItems.map((item) => item.flashcard_id.toString()));

  return flashcards.map((item) => ({
    ...item.toObject(),
    cards_count: countMap.get(item._id.toString()) || 0,
    is_saved: savedSet.has(item._id.toString()),
  }));
}

async function buildFlashcardDetail(flashcard, user) {
  const populatedFlashcard = await flashcard.populate(POPULATE_OPTIONS);
  const cards = await Card.find({ flashcard_id: flashcard._id }).sort({ position: 1, created_at: 1 });
  const saved = user
    ? await SavedFlashcard.exists({ user_id: user._id, flashcard_id: flashcard._id })
    : null;

  return {
    flashcard: {
      ...populatedFlashcard.toObject(),
      cards_count: cards.length,
      is_saved: Boolean(saved),
    },
    cards,
  };
}

const getPublicFlashcards = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
  const skip = (page - 1) * limit;

  const filter = {
    visibility: "public",
    approval_status: "approved",
  };

  if (req.query.search) {
    const keyword = String(req.query.search).trim();
    filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ];
  }

  ["language", "topic", "level"].forEach((queryKey) => {
    if (!req.query[queryKey]) return;
    const field = `${queryKey}_id`;
    if (isObjectId(req.query[queryKey])) filter[field] = req.query[queryKey];
  });

  const sortMap = {
    oldest: { created_at: 1 },
    name: { name: 1 },
    newest: { created_at: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Flashcard.find(filter).populate(POPULATE_OPTIONS).sort(sort).skip(skip).limit(limit),
    Flashcard.countDocuments(filter),
  ]);

  sendSuccess(res, {
    flashcards: await attachCardCounts(items, req.user),
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
    },
  }, "Get flashcards successfully");
});

const getFlashcardById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const flashcard = await Flashcard.findById(req.params.id);
  if (!flashcard) throw new ApiError(404, "Flashcard not found");
  if (!canViewFlashcard(flashcard, req.user)) throw new ApiError(403, "Forbidden");

  sendSuccess(res, await buildFlashcardDetail(flashcard, req.user), "Get flashcard detail successfully");
});

const getMyFlashcards = asyncHandler(async (req, res) => {
  const flashcards = await Flashcard.find({ user_id: req.user._id })
    .populate(POPULATE_OPTIONS)
    .sort({ created_at: -1 });

  const flashcardsWithCounts = await attachCardCounts(flashcards, req.user);
  const cards = await Card.find({ flashcard_id: { $in: flashcards.map((item) => item._id) } });
  const cardIds = cards.map((card) => card._id);
  const progressList = await StudyProgress.find({ user_id: req.user._id, card_id: { $in: cardIds } });
  const progressByCard = new Map(progressList.map((item) => [item.card_id.toString(), item]));
  const cardsByFlashcard = cards.reduce((map, card) => {
    const key = card.flashcard_id.toString();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(card);
    return map;
  }, new Map());

  const data = flashcardsWithCounts.map((flashcard) => {
    const relatedCards = cardsByFlashcard.get(flashcard._id.toString()) || [];
    const learned = relatedCards.filter((card) => {
      const progress = progressByCard.get(card._id.toString());
      return progress && ["learning", "review", "mastered"].includes(progress.status);
    }).length;

    return {
      ...flashcard,
      progress: {
        learned,
        total: relatedCards.length,
        percent: relatedCards.length === 0 ? 0 : Math.round((learned / relatedCards.length) * 100),
      },
    };
  });

  sendSuccess(res, { flashcards: data }, "Get my flashcards successfully");
});

const createFlashcard = asyncHandler(async (req, res) => {
  assertRequired(req.body.name, "name");
  assertRequired(req.body.language_id, "language_id");
  assertRequired(req.body.topic_id, "topic_id");
  assertRequired(req.body.level_id, "level_id");

  const payload = cleanFlashcardPayload(req.body);
  await assertOwnedTags(req.user._id, payload.tag_ids || []);
  payload.user_id = req.user._id;
  payload.visibility = payload.visibility || "private";
  payload.approval_status = payload.visibility === "public" ? "pending" : "approved";

  const cardsPayload = cleanCardsPayload(req.body.cards);
  const flashcard = await Flashcard.create(payload);

  if (cardsPayload.length > 0) {
    await Card.insertMany(cardsPayload.map((card) => ({ ...card, flashcard_id: flashcard._id })));
  }

  sendSuccess(res, await buildFlashcardDetail(flashcard, req.user), "Create flashcard successfully", 201);
});

const updateFlashcard = asyncHandler(async (req, res) => {
  const flashcard = await ensureOwner(req.params.id, req.user);
  const payload = cleanFlashcardPayload(req.body);
  await assertOwnedTags(req.user._id, payload.tag_ids || []);

  if (payload.visibility && payload.visibility !== flashcard.visibility) {
    payload.approval_status = payload.visibility === "public" ? "pending" : "approved";
  }

  Object.assign(flashcard, payload);
  await flashcard.save();

  if (req.body.cards !== undefined) {
    const cardsPayload = cleanCardsPayload(req.body.cards);
    const oldCards = await Card.find({ flashcard_id: flashcard._id }).select("front_img back_img");
    await Promise.all(oldCards.map((card) => deleteCardImages(card)));
    await Card.deleteMany({ flashcard_id: flashcard._id });
    if (cardsPayload.length > 0) {
      await Card.insertMany(cardsPayload.map((card) => ({ ...card, flashcard_id: flashcard._id })));
    }
  }

  sendSuccess(res, await buildFlashcardDetail(flashcard, req.user), "Update flashcard successfully");
});

const deleteFlashcard = asyncHandler(async (req, res) => {
  const flashcard = await ensureOwnerOrAdmin(req.params.id, req.user);
  const cards = await Card.find({ flashcard_id: flashcard._id }).select("_id front_img back_img");
  const cardIds = cards.map((card) => card._id);

  await Promise.all([
    StudyHistory.deleteMany({ card_id: { $in: cardIds } }),
    StudyProgress.deleteMany({ card_id: { $in: cardIds } }),
    Card.deleteMany({ flashcard_id: flashcard._id }),
    SavedFlashcard.deleteMany({ flashcard_id: flashcard._id }),
  ]);

  await Promise.all(cards.map((card) => deleteCardImages(card)));
  await flashcard.deleteOne();

  sendSuccess(res, {}, "Delete flashcard successfully");
});

module.exports = {
  createFlashcard,
  deleteFlashcard,
  getFlashcardById,
  getMyFlashcards,
  getPublicFlashcards,
  updateFlashcard,
};
