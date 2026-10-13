const express = require("express");
const lookupController = require("../controllers/lookupController");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, lookupController.list("languages"));
router.post("/", authMiddleware, adminMiddleware, lookupController.create("languages"));
router.put("/:id", authMiddleware, adminMiddleware, lookupController.update("languages"));
router.delete("/:id", authMiddleware, adminMiddleware, lookupController.remove("languages"));

module.exports = router;
