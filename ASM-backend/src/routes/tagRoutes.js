const express = require("express");
const tagController = require("../controllers/tagController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, tagController.getTags);
router.post("/", authMiddleware, tagController.createTag);
router.put("/:id", authMiddleware, tagController.updateTag);
router.delete("/:id", authMiddleware, tagController.deleteTag);

module.exports = router;
