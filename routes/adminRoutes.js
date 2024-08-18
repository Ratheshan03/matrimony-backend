const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const adminAuth = require("../middlewares/adminMiddleware");

// Apply adminAuth middleware
router.get("/pending-profiles", adminController.getPendingProfiles);
router.get("/all-profiles", adminController.getAllProfiles);
router.get("/approved-profiles", adminController.getApprovedProfiles);
router.put("/approve-profile/:id", adminController.approveProfile);
router.put("/suspend-user/:id", adminController.suspendUser);
router.delete("/delete-profile/:id", adminController.deleteProfile);
router.put("/edit-profile/:id", adminController.editProfile);

module.exports = router;
