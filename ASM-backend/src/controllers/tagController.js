const Flashcard = require("../models/Flashcard");
const Tag = require("../models/Tag");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId, assertRequired, pickAllowed } = require("../utils/validators");

const TAG_FIELDS = ["name", "description"];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanTagPayload(body) {
  const payload = pickAllowed(body, TAG_FIELDS);
  if (payload.name !== undefined) payload.name = String(payload.name).trim();
  if (payload.description !== undefined) payload.description = String(payload.description).trim();
  return payload;
}

async function ensureUniqueTagName(userId, name, currentTagId = null) {
  const query = {
    user_id: userId,
    name: { $regex: `^${escapeRegExp(name)}$`, $options: "i" },
  };

  if (currentTagId) {
    query._id = { $ne: currentTagId };
  }

  const existingTag = await Tag.findOne(query);
  if (existingTag) {
    throw new ApiError(409, "Tag name already exists");
  }
}

const getTags = asyncHandler(async (req, res) => {
  const tags = await Tag.find({ user_id: req.user._id }).sort({ name: 1, created_at: 1 });
  sendSuccess(res, { tags }, "Get tags successfully");
});

const createTag = asyncHandler(async (req, res) => {
  assertRequired(req.body.name, "name");

  const payload = cleanTagPayload(req.body);
  await ensureUniqueTagName(req.user._id, payload.name);

  const tag = await Tag.create({
    ...payload,
    user_id: req.user._id,
  });

  sendSuccess(res, { tag }, "Create tag successfully", 201);
});

const updateTag = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const payload = cleanTagPayload(req.body);
  if (payload.name !== undefined) {
    assertRequired(payload.name, "name");
    await ensureUniqueTagName(req.user._id, payload.name, req.params.id);
  }

  const tag = await Tag.findOneAndUpdate(
    { _id: req.params.id, user_id: req.user._id },
    payload,
    { new: true, runValidators: true },
  );

  if (!tag) throw new ApiError(404, "Tag not found");

  sendSuccess(res, { tag }, "Update tag successfully");
});

const deleteTag = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id);

  const tag = await Tag.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
  if (!tag) throw new ApiError(404, "Tag not found");

  await Flashcard.updateMany(
    { user_id: req.user._id, tag_ids: tag._id },
    { $pull: { tag_ids: tag._id } },
  );

  sendSuccess(res, {}, "Delete tag successfully");
});

module.exports = {
  createTag,
  deleteTag,
  getTags,
  updateTag,
};
