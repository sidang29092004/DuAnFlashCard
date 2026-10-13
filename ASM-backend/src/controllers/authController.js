const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getJwtExpiresIn, getJwtSecret } = require("../config/jwt");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/response");
const { assertRequired, isEmail } = require("../utils/validators");

function signToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );
}

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

function looksLikeBcryptHash(value) {
  return /^\$2[aby]\$\d{2}\$/.test(String(value || ""));
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  assertRequired(name, "name");
  assertRequired(email, "email");
  assertRequired(password, "password");

  if (!isEmail(email)) {
    throw new ApiError(400, "email is invalid");
  }

  if (String(password).length < 6) {
    throw new ApiError(400, "password must have at least 6 characters");
  }

  const existingUser = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (existingUser) {
    throw new ApiError(409, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  sendSuccess(
    res,
    {
      token: signToken(user),
      user: publicUser(user),
    },
    "Register successfully",
    201,
  );
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  assertRequired(email, "email");
  assertRequired(password, "password");

  if (!isEmail(email)) {
    throw new ApiError(400, "email is invalid");
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
  if (!user) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  if (user.status === "locked") {
    throw new ApiError(403, "Account is locked");
  }

  const passwordIsHashed = looksLikeBcryptHash(user.password);
  const matched = passwordIsHashed
    ? await bcrypt.compare(password, user.password)
    : password === user.password;

  if (!matched) {
    throw new ApiError(401, "Email or password is incorrect");
  }

  if (!passwordIsHashed) {
    user.password = await bcrypt.hash(password, 10);
    await user.save();
  }

  sendSuccess(res, {
    token: signToken(user),
    user: publicUser(user),
  }, "Login successfully");
});

const me = asyncHandler(async (req, res) => {
  sendSuccess(res, { user: publicUser(req.user) }, "Get current user successfully");
});

const changePassword = asyncHandler(async (req, res) => {
  const { current_password, new_password } = req.body;

  assertRequired(current_password, "current_password");
  assertRequired(new_password, "new_password");

  if (String(new_password).length < 6) {
    throw new ApiError(400, "new_password must have at least 6 characters");
  }

  const user = await User.findById(req.user._id).select("+password");
  const matched = await bcrypt.compare(current_password, user.password);
  if (!matched) {
    throw new ApiError(400, "Current password is incorrect");
  }

  user.password = await bcrypt.hash(new_password, 10);
  await user.save();

  sendSuccess(res, {}, "Password changed successfully");
});

module.exports = {
  changePassword,
  login,
  me,
  register,
};
