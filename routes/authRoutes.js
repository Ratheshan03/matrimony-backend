const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Register, Login, and Admin Approval
router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

// Password Reset
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/reset-password/:token", authController.resetPassword);

// Logout and Refresh Token
router.post("/logout", authController.logoutUser);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;
