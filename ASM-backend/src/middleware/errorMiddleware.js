const ApiError = require("../utils/ApiError");

function notFoundMiddleware(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorMiddleware(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid MongoDB ObjectId";
  }

  if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate data";
  }

  if (err.name === "MulterError") {
    const isExcelImport = req.originalUrl.startsWith("/api/import");
    statusCode = 400;
    message = err.code === "LIMIT_FILE_SIZE"
      ? (isExcelImport ? "Excel file size must be 5MB or smaller" : "Image size must be 5MB or smaller")
      : (isExcelImport ? "Invalid Excel upload" : "Invalid image upload");
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Invalid or expired token";
  }

  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { errorMiddleware, notFoundMiddleware };
