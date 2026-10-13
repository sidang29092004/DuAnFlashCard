const express = require("express");
const savedController = require("../controllers/savedController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, savedController.getSavedFlashcards);
router.post("/:flashcardId", authMiddleware, savedController.saveFlashcard);
router.delete("/:flashcardId", authMiddleware, savedController.unsaveFlashcard);

module.exports = router;
