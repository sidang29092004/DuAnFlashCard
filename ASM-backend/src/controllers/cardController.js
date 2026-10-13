const Card = require("../models/Card");
const StudyHistory = require("../models/StudyHistory");
const StudyProgress = require("../models/StudyProgress");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId, assertRequired, pickAllowed } = require("../utils/validators");
const { ensureOwner } = require("../services/flashcardAccess");
const { deleteCardImagePaths, deleteCardImages, toCardImagePath } = require("../utils/fileUtils");

const CARD_FIELDS = ["front", "front_img", "back", "back_img", "color", "position"];

function uploadedImagePath(req, fieldName) {
  const file = req.files?.[fieldName]?.[0];
  return file ? toCardImagePath(file.filename) : "";
}

function uploadedImagePaths(req) {
  return {
    front_img: uploadedImagePath(req, "front_image"),
    back_img: uploadedImagePath(req, "back_image"),
  };
}

function normalizeCardPayload(body) {
  const payload = pickAllowed(body, CARD_FIELDS);

  ["front", "front_img", "back", "back_img", "color"].forEach((field) => {
    if (payload[field] !== undefined) payload[field] = String(payload[field]).trim();
  });

  if (payload.position !== undefined) {
    const position = Number(payload.position);
    payload.position = Number.isFinite(position) ? position : 0;
  }

  return payload;
}

function isRemoveFlag(value) {
  return value === true || value === "true" || value === "1" || value === 1;
}

const getCardsByFlashcard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.flashcardId, "flashcardId");

  const cards = await Card.find({ flashcard_id: req.params.flashcardId }).sort({ position: 1, created_at: 1 });
  sendSuccess(res, { cards }, "Get cards successfully");
});

const createCard = asyncHandler(async (req, res) => {
  const images = uploadedImagePaths(req);

  try {
    await ensureOwner(req.params.flashcardId, req.user);
    assertRequired(req.body.front, "front");
    assertRequired(req.body.back, "back");

    const payload = normalizeCardPayload(req.body);
    if (payload.position === undefined) {
      payload.position = await Card.countDocuments({ flashcard_id: req.params.flashcardId });
    }

    const card = await Card.create({
      flashcard_id: req.params.flashcardId,
      front: payload.front,
      front_img: images.front_img || payload.front_img || "",
      back: payload.back,
      back_img: images.back_img || payload.back_img || "",
      color: payload.color || "#ffffff",
      position: payload.position,
    });

    sendSuccess(res, { card }, "Create card successfully", 201);
  } catch (error) {
    await deleteCardImagePaths([images.front_img, images.back_img]);
    throw error;
  }
});

const updateCard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);
  const images = uploadedImagePaths(req);

  try {
    const card = await Card.findById(req.params.id);
    if (!card) throw new ApiError(404, "Card not found");

    await ensureOwner(card.flashcard_id, req.user);

    const oldFrontImage = card.front_img;
    const oldBackImage = card.back_img;
    const payload = normalizeCardPayload(req.body);

    if (images.front_img) {
      payload.front_img = images.front_img;
    } else if (isRemoveFlag(req.body.remove_front_image)) {
      payload.front_img = "";
    }

    if (images.back_img) {
      payload.back_img = images.back_img;
    } else if (isRemoveFlag(req.body.remove_back_image)) {
      payload.back_img = "";
    }

    Object.assign(card, payload);
    await card.save();

    const removedImages = [];
    if ((images.front_img || isRemoveFlag(req.body.remove_front_image)) && oldFrontImage) {
      removedImages.push(oldFrontImage);
    }
    if ((images.back_img || isRemoveFlag(req.body.remove_back_image)) && oldBackImage) {
      removedImages.push(oldBackImage);
    }
    await deleteCardImagePaths(removedImages);

    sendSuccess(res, { card }, "Update card successfully");
  } catch (error) {
    await deleteCardImagePaths([images.front_img, images.back_img]);
    throw error;
  }
});

const deleteCard = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const card = await Card.findById(req.params.id);
  if (!card) throw new ApiError(404, "Card not found");

  await ensureOwner(card.flashcard_id, req.user);
  await Promise.all([
    StudyHistory.deleteMany({ card_id: card._id }),
    StudyProgress.deleteMany({ card_id: card._id }),
  ]);
  await card.deleteOne();
  await deleteCardImages(card);

  sendSuccess(res, {}, "Delete card successfully");
});

module.exports = {
  createCard,
  deleteCard,
  getCardsByFlashcard,
  updateCard,
};
