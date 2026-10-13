const express = require("express");
const lookupController = require("../controllers/lookupController");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, lookupController.list("levels"));
router.post("/", authMiddleware, adminMiddleware, lookupController.create("levels"));
router.put("/:id", authMiddleware, adminMiddleware, lookupController.update("levels"));
router.delete("/:id", authMiddleware, adminMiddleware, lookupController.remove("levels"));

module.exports = router;
