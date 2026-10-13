const Language = require("../models/Language");
const Level = require("../models/Level");
const Topic = require("../models/Topic");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertObjectId, assertRequired, pickAllowed } = require("../utils/validators");

const registry = {
  languages: {
    model: Language,
    fields: ["name", "code", "status"],
  },
  levels: {
    model: Level,
    fields: ["name", "description", "status"],
  },
  topics: {
    model: Topic,
    fields: ["name", "description", "status"],
  },
};

function getRegistryItem(type) {
  const item = registry[type];
  if (!item) throw new ApiError(500, "Invalid lookup type");
  return item;
}

function list(type) {
  return asyncHandler(async (req, res) => {
    const { model } = getRegistryItem(type);
    const query = req.user?.role === "admin" && req.query.all === "true" ? {} : { status: "active" };
    const items = await model.find(query).sort({ name: 1 });

    sendSuccess(res, { items }, "Get lookup data successfully");
  });
}

function create(type) {
  return asyncHandler(async (req, res) => {
    const { model, fields } = getRegistryItem(type);
    assertRequired(req.body.name, "name");

    const payload = pickAllowed(req.body, fields);
    const item = await model.create(payload);

    sendSuccess(res, { item }, "Create lookup data successfully", 201);
  });
}

function update(type) {
  return asyncHandler(async (req, res) => {
    const { model, fields } = getRegistryItem(type);
    assertObjectId(req.params.id);

    const item = await model.findByIdAndUpdate(req.params.id, pickAllowed(req.body, fields), {
      new: true,
      runValidators: true,
    });

    if (!item) throw new ApiError(404, "Lookup data not found");

    sendSuccess(res, { item }, "Update lookup data successfully");
  });
}

function remove(type) {
  return asyncHandler(async (req, res) => {
    const { model } = getRegistryItem(type);
    assertObjectId(req.params.id);

    const item = await model.findByIdAndDelete(req.params.id);
    if (!item) throw new ApiError(404, "Lookup data not found");

    sendSuccess(res, {}, "Delete lookup data successfully");
  });
}

module.exports = {
  create,
  list,
  remove,
  update,
};
