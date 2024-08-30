const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

// Display all approved profiles with limited info (Non-Logged-In Users)
router.get(
  "/approved-profiles-limited",
  profileController.getApprovedProfilesLimited
);

// Display all approved profiles with full info (Logged-In Users)
router.get(
  "/approved-profiles-full",
  authMiddleware.protect,
  profileController.getApprovedProfilesFull
);

// Update Profile
router.put("/update", authMiddleware.protect, profileController.updateProfile);

// Route to upload profile photo
router.post(
  "/upload-profile-photo",
  authMiddleware.protect,
  upload.single("photo"),
  profileController.uploadProfilePhoto
);

// Route to upload additional photos
router.post(
  "/upload-additional-photo",
  authMiddleware.protect,
  upload.single("photo"),
  profileController.uploadAdditionalPhoto
);

// Route to remove a photo (profile or additional)
router.post(
  "/remove-photo",
  authMiddleware.protect,
  profileController.removePhoto
);

// Search Profiles
router.get("/search", authMiddleware.protect, profileController.searchProfiles);

// Mark a profile as favorite
router.post(
  "/favorite",
  authMiddleware.protect,
  profileController.markAsFavorite
);

// View favorite profiles
router.get(
  "/favorites",
  authMiddleware.protect,
  profileController.viewFavoriteProfiles
);

// View Profile Details
router.get("/:id", authMiddleware.protect, profileController.getProfileDetails);

module.exports = router;
