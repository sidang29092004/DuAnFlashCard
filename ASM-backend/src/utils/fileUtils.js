const fs = require("fs");
const path = require("path");

const UPLOAD_ROOT = path.join(__dirname, "../../uploads");
const CARD_UPLOAD_DIR = path.join(UPLOAD_ROOT, "cards");

function ensureCardUploadDir() {
  fs.mkdirSync(CARD_UPLOAD_DIR, { recursive: true });
}

function toCardImagePath(filename) {
  return `/uploads/cards/${filename}`;
}

async function deleteCardImage(imagePath) {
  if (!imagePath) return;

  const filename = path.basename(String(imagePath));
  if (!filename || filename === "." || filename === "..") return;

  const filePath = path.join(CARD_UPLOAD_DIR, filename);
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(`Could not delete uploaded card image: ${filePath}`, error.message);
    }
  }
}

async function deleteCardImages(card) {
  await Promise.all([
    deleteCardImage(card?.front_img),
    deleteCardImage(card?.back_img),
  ]);
}

async function deleteCardImagePaths(paths) {
  await Promise.all((paths || []).filter(Boolean).map((item) => deleteCardImage(item)));
}

module.exports = {
  CARD_UPLOAD_DIR,
  deleteCardImage,
  deleteCardImagePaths,
  deleteCardImages,
  ensureCardUploadDir,
  toCardImagePath,
  UPLOAD_ROOT,
};
