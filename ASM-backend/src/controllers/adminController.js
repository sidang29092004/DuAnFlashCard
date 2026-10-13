const Card = require("../models/Card");
const Flashcard = require("../models/Flashcard");
const SavedFlashcard = require("../models/SavedFlashcard");
const StudyHistory = require("../models/StudyHistory");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId } = require("../utils/validators");

const POPULATE_FLASHCARD = [
  { path: "user_id", select: "name email role status" },
  { path: "language_id" },
  { path: "topic_id" },
  { path: "level_id" },
  { path: "tag_ids" },
];

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function attachCardCounts(flashcards) {
  const ids = flashcards.map((item) => item._id);
  const counts = await Card.aggregate([
    { $match: { flashcard_id: { $in: ids } } },
    { $group: { _id: "$flashcard_id", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((item) => [item._id.toString(), item.count]));

  return flashcards.map((item) => ({
    ...item.toObject(),
    cards_count: countMap.get(item._id.toString()) || 0,
  }));
}

const getDashboard = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalFlashcards,
    publicFlashcards,
    pendingFlashcards,
    savedFlashcards,
    studyReviews,
    latestFlashcards,
  ] = await Promise.all([
    User.countDocuments(),
    Flashcard.countDocuments(),
    Flashcard.countDocuments({ visibility: "public", approval_status: "approved" }),
    Flashcard.countDocuments({ visibility: "public", approval_status: "pending" }),
    SavedFlashcard.countDocuments(),
    StudyHistory.countDocuments(),
    Flashcard.find().populate(POPULATE_FLASHCARD).sort({ created_at: -1 }).limit(5),
  ]);

  sendSuccess(res, {
    totals: {
      users: totalUsers,
      flashcards: totalFlashcards,
      public_flashcards: publicFlashcards,
      pending_flashcards: pendingFlashcards,
      saved_flashcards: savedFlashcards,
      study_reviews: studyReviews,
    },
    recent_flashcards: await attachCardCounts(latestFlashcards),
  }, "Get admin dashboard successfully");
});

const getPendingFlashcards = asyncHandler(async (req, res) => {
  const flashcards = await Flashcard.find({ visibility: "public", approval_status: "pending" })
    .populate(POPULATE_FLASHCARD)
    .sort({ created_at: -1 });

  sendSuccess(res, { flashcards: await attachCardCounts(flashcards) }, "Get pending flashcards successfully");
});

const getFlashcards = asyncHandler(async (req, res) => {
  const status = req.query.status;
  const filter = {};

  if (["pending", "approved", "rejected"].includes(status)) {
    filter.visibility = "public";
    filter.approval_status = status;
  }

  if (status === "hidden" || status === "private") {
    filter.visibility = "private";
  }

  const flashcards = await Flashcard.find(filter)
    .populate(POPULATE_FLASHCARD)
    .sort({ created_at: -1 });

  sendSuccess(res, { flashcards: await attachCardCounts(flashcards) }, "Get admin flashcards successfully");
});

const approveFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const flashcard = await Flashcard.findByIdAndUpdate(
    req.params.id,
    { approval_status: "approved", visibility: "public" },
    { new: true, runValidators: true },
  ).populate(POPULATE_FLASHCARD);

  if (!flashcard) throw new ApiError(404, "Flashcard not found");

  sendSuccess(res, { flashcard }, "Approve flashcard successfully");
});

const rejectFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const flashcard = await Flashcard.findByIdAndUpdate(
    req.params.id,
    { approval_status: "rejected", visibility: "public" },
    { new: true, runValidators: true },
  ).populate(POPULATE_FLASHCARD);

  if (!flashcard) throw new ApiError(404, "Flashcard not found");

  sendSuccess(res, { flashcard }, "Reject flashcard successfully");
});

const hideFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const flashcard = await Flashcard.findByIdAndUpdate(
    req.params.id,
    { visibility: "private", approval_status: "approved" },
    { new: true, runValidators: true },
  ).populate(POPULATE_FLASHCARD);

  if (!flashcard) throw new ApiError(404, "Flashcard not found");

  sendSuccess(res, { flashcard }, "Hide flashcard successfully");
});

const showFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const flashcard = await Flashcard.findByIdAndUpdate(
    req.params.id,
    { visibility: "public", approval_status: "approved" },
    { new: true, runValidators: true },
  ).populate(POPULATE_FLASHCARD);

  if (!flashcard) throw new ApiError(404, "Flashcard not found");

  sendSuccess(res, { flashcard }, "Show flashcard successfully");
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ created_at: -1 });
  sendSuccess(res, { users: users.map(publicUser) }, "Get users successfully");
});

const lockUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "Admin cannot lock own account");
  }

  const user = await User.findByIdAndUpdate(req.params.id, { status: "locked" }, { new: true });
  if (!user) throw new ApiError(404, "User not found");

  sendSuccess(res, { user: publicUser(user) }, "Lock user successfully");
});

const unlockUser = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const user = await User.findByIdAndUpdate(req.params.id, { status: "active" }, { new: true });
  if (!user) throw new ApiError(404, "User not found");

  sendSuccess(res, { user: publicUser(user) }, "Unlock user successfully");
});

module.exports = {
  approveFlashcard,
  getDashboard,
  getFlashcards,
  getPendingFlashcards,
  getUsers,
  hideFlashcard,
  lockUser,
  rejectFlashcard,
  showFlashcard,
  unlockUser,
};
