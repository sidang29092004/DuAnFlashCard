const express = require("express");
const adminController = require("../controllers/adminController");
const adminMiddleware = require("../middleware/adminMiddleware");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", adminController.getDashboard);
router.get("/flashcards", adminController.getFlashcards);
router.get("/flashcards/pending", adminController.getPendingFlashcards);
router.put("/flashcards/:id/approve", adminController.approveFlashcard);
router.put("/flashcards/:id/reject", adminController.rejectFlashcard);
router.put("/flashcards/:id/hide", adminController.hideFlashcard);
router.put("/flashcards/:id/show", adminController.showFlashcard);
router.get("/users", adminController.getUsers);
router.put("/users/:id/lock", adminController.lockUser);
router.put("/users/:id/unlock", adminController.unlockUser);

module.exports = router;
