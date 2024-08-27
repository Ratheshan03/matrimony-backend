const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

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
  upload.single("photo"),
  profileController.uploadProfilePhoto
);

// Route to upload additional photos
router.post(
  "/upload-additional-photo",
  upload.single("photo"),
  profileController.uploadAdditionalPhoto
);

// Route to remove a photo (profile or additional)
router.post("/remove-photo", profileController.removePhoto);

// Search Profiles
router.get("/search", profileController.searchProfiles);

// View Profile Details
router.get("/:id", profileController.getProfileDetails);

// Mark Profile as Favorite
router.post(
  "/mark-favorite/:id",
  authMiddleware.protect,
  profileController.markAsFavorite
);

module.exports = router;
