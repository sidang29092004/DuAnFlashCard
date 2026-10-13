const ApiError = require("../utils/ApiError");

function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    throw new ApiError(403, "Admin permission required");
  }

  next();
}

module.exports = adminMiddleware;
