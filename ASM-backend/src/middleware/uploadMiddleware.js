const path = require("path");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const { CARD_UPLOAD_DIR, ensureCardUploadDir } = require("../utils/fileUtils");

const ALLOWED_IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

ensureCardUploadDir();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, CARD_UPLOAD_DIR);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = [".jpg", ".jpeg", ".png", ".webp"].includes(ext) ? ext : "";
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

function imageFileFilter(req, file, cb) {
  if (!ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
    cb(new ApiError(400, "Only JPG, JPEG, PNG, and WEBP images are allowed"));
    return;
  }

  cb(null, true);
}

const uploadCardImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 2,
  },
}).fields([
  { name: "front_image", maxCount: 1 },
  { name: "back_image", maxCount: 1 },
]);

module.exports = {
  uploadCardImages,
};
