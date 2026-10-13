const express = require("express");
const cardController = require("../controllers/cardController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadCardImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.put("/:id", authMiddleware, uploadCardImages, cardController.updateCard);
router.delete("/:id", authMiddleware, cardController.deleteCard);

module.exports = router;
