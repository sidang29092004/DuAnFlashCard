const Flashcard = require("../models/Flashcard");
const ApiError = require("../utils/ApiError");
const { assertObjectId } = require("../utils/validators");

function isOwner(flashcard, user) {
  return Boolean(user && flashcard.user_id && flashcard.user_id.toString() === user._id.toString());
}

function isAdmin(user) {
  return user?.role === "admin";
}

async function findFlashcardOrFail(id) {
  assertObjectId(id);

  const flashcard = await Flashcard.findById(id);
  if (!flashcard) throw new ApiError(404, "Flashcard not found");

  return flashcard;
}

async function ensureOwner(id, user) {
  const flashcard = await findFlashcardOrFail(id);

  if (!isOwner(flashcard, user)) {
    throw new ApiError(403, "Only owner can do this action");
  }

  return flashcard;
}

async function ensureOwnerOrAdmin(id, user) {
  const flashcard = await findFlashcardOrFail(id);

  if (!isOwner(flashcard, user) && !isAdmin(user)) {
    throw new ApiError(403, "Only owner or admin can do this action");
  }

  return flashcard;
}

function canViewFlashcard(flashcard, user) {
  if (flashcard.visibility === "public" && flashcard.approval_status === "approved") return true;
  if (isOwner(flashcard, user)) return true;
  if (isAdmin(user)) return true;
  return false;
}

module.exports = {
  canViewFlashcard,
  ensureOwner,
  ensureOwnerOrAdmin,
  findFlashcardOrFail,
  isOwner,
};
