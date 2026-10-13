const express = require("express");
const assistantController = require("../controllers/assistantController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/vocabulary", authMiddleware, assistantController.createVocabulary);

module.exports = router;
