const User = require("../models/User");
const Profile = require("../models/Profile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const crypto = require("crypto"); // For generating reset tokens

// JWT and Refresh Token secret
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

// Token expiry times
const JWT_EXPIRATION = "1h";
const REFRESH_TOKEN_EXPIRATION = "7d";

// Register User
exports.registerUser = async (req, res) => {
  const { email, ...profileData } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if email exists
    let user = await User.findOne({ email });
    if (user) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "User already exists" });
    }

    // Create profile
    const profile = new Profile({
      ...profileData,
      photos: [], // Initialize empty photos array
    });

    await profile.save({ session });

    // Create user with status pending approval
    user = new User({
      email,
      username: "",
      password: "",
      profile: profile._id, // Link User to Profile
    });

    await user.save({ session });

    // Update profile to link it to the user
    profile.user = user._id; // Link Profile to User
    await profile.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Profile submitted, pending approval" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !user.isApproved)
      return res
        .status(400)
        .json({ message: "Invalid credentials or not approved" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // Clean up expired refresh tokens
    user.refreshTokens = user.refreshTokens.filter(
      (tokenObj) => tokenObj.expires > Date.now()
    );

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    const refreshToken = jwt.sign({ userId: user._id }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });

    // Save new refresh token to user's document
    user.refreshTokens.push({
      token: refreshToken,
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
    });

    // Limit the number of stored refresh tokens
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }

    await user.save();

    res.status(200).json({ token, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Logout User
exports.logoutUser = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { "refreshTokens.token": refreshToken },
      { $pull: { refreshTokens: { token: refreshToken } } }
    );

    if (!user)
      return res.status(400).json({ message: "Invalid refresh token" });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { token } = req.body;

  try {
    const user = await User.findOne({
      "refreshTokens.token": token,
      "refreshTokens.expires": { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user)
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });

    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const accessToken = jwt.sign(
      { userId: decoded.userId, isAdmin: decoded.isAdmin },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRATION }
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: "Invalid refresh token" });
  }
};

// Request Password Reset
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate password reset token
    const resetToken = crypto.randomBytes(20).toString("hex");

    // Set token and expiration on the user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send reset email
    const resetUrl = `http://${req.headers.host}/auth/reset-password/${resetToken}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    // Hash new password and update user
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
