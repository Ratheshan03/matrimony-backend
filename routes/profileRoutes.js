const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");

router.put("/update", authMiddleware.protect, profileController.updateProfile);
router.post(
  "/upload-photo",
  authMiddleware.protect,
  profileController.uploadPhoto
);

module.exports = router;
