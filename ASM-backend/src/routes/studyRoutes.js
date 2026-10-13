const express = require("express");
const studyController = require("../controllers/studyController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/progress/:flashcardId", authMiddleware, studyController.getProgress);
router.get("/:flashcardId", authMiddleware, studyController.getStudyCards);
router.post("/review", authMiddleware, studyController.reviewCard);

module.exports = router;
