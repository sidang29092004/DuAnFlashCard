const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");

const ALLOWED_EXCEL_EXTENSIONS = new Set([".xlsx", ".xls"]);
const MAX_EXCEL_SIZE = 5 * 1024 * 1024;

function excelFileFilter(req, file, cb) {
  const ext = path.extname(file.originalname || "").toLowerCase();
  if (!ALLOWED_EXCEL_EXTENSIONS.has(ext)) {
    cb(new ApiError(400, "Only .xlsx and .xls files are allowed"));
    return;
  }

  cb(null, true);
}

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFileFilter,
  limits: {
    fileSize: MAX_EXCEL_SIZE,
    files: 1,
  },
}).single("file");

module.exports = {
  uploadExcel,
};
