const User = require("models/User");
const Profile = require("models/Profile");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// Register User
exports.registerUser = async (req, res) => {
  const { email, ...profileData } = req.body;

  try {
    // Check if email exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    // Create profile
    const profile = new Profile(profileData);
    await profile.save();

    // Create user with status pending approval
    user = new User({
      email,
      password: "", // Empty until approved
      profile: profile._id,
    });
    await user.save();

    res.status(201).json({ message: "Profile submitted, pending approval" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Admin approves user and sends credentials
exports.approveUser = async (req, res) => {
  const { userId, temporaryPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(temporaryPassword, 10);
    user.isApproved = true;
    await user.save();

    // Send email with credentials
    // Implement email logic with Nodemailer or similar
    // await sendEmail(user.email, temporaryPassword);

    res.status(200).json({ message: "User approved and credentials sent" });
  } catch (error) {
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

    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
