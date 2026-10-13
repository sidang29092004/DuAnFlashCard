const express = require("express");
const lookupController = require("../controllers/lookupController");
const { authMiddleware, optionalAuthMiddleware } = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, lookupController.list("topics"));
router.post("/", authMiddleware, adminMiddleware, lookupController.create("topics"));
router.put("/:id", authMiddleware, adminMiddleware, lookupController.update("topics"));
router.delete("/:id", authMiddleware, adminMiddleware, lookupController.remove("topics"));

module.exports = router;
