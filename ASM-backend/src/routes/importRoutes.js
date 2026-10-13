const express = require("express");
const importController = require("../controllers/importController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { uploadExcel } = require("../middleware/importUploadMiddleware");

const router = express.Router();

router.post("/excel", authMiddleware, uploadExcel, importController.importExcel);

module.exports = router;
