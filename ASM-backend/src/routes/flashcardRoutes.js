const express = require("express");
const cardController = require("../controllers/cardController");
const flashcardController = require("../controllers/flashcardController");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/authMiddleware");
const { uploadCardImages } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, flashcardController.getPublicFlashcards);
router.get("/my", authMiddleware, flashcardController.getMyFlashcards);
router.post("/", authMiddleware, flashcardController.createFlashcard);
router.get("/:id", optionalAuthMiddleware, flashcardController.getFlashcardById);
router.put("/:id", authMiddleware, flashcardController.updateFlashcard);
router.delete("/:id", authMiddleware, flashcardController.deleteFlashcard);

router.get("/:flashcardId/cards", cardController.getCardsByFlashcard);
router.post("/:flashcardId/cards", authMiddleware, uploadCardImages, cardController.createCard);

module.exports = router;
