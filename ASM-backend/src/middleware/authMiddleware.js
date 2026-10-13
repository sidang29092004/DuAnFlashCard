const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtSecret } = require("../config/jwt");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Unauthorized");
  }

  const payload = jwt.verify(token, getJwtSecret());
  const user = await User.findById(payload.id).select("-password");

  if (!user || user.status === "locked") {
    throw new ApiError(401, "Unauthorized");
  }

  req.user = user;
  next();
});

const optionalAuthMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = await User.findById(payload.id).select("-password");
  } catch (error) {
    req.user = null;
  }

  next();
});

module.exports = { authMiddleware, optionalAuthMiddleware };
