const mongoose = require("mongoose");
const ApiError = require("./ApiError");

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function assertObjectId(value, fieldName = "id") {
  if (!isObjectId(value)) {
    throw new ApiError(400, `${fieldName} is not a valid MongoDB ObjectId`);
  }
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function assertRequired(value, fieldName) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new ApiError(400, `${fieldName} is required`);
  }
}

function pickAllowed(source, fields) {
  return fields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
}

module.exports = {
  assertObjectId,
  assertRequired,
  isEmail,
  isObjectId,
  pickAllowed,
};
