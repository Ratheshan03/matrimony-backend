const Profile = require("../models/Profile");
const User = require("../models/User");

exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getPendingProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ isApproved: false });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getApprovedProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find({ isApproved: true });
    res.status(200).json(profiles);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.approveProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }
    profile.isApproved = true;
    await profile.save();
    res.status(200).json({ message: "Profile approved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Find and delete the associated user
    const user = await User.findOne({ profile: req.params.id });
    if (user) {
      await User.deleteOne({ _id: user._id });
    }

    // Delete the profile
    await Profile.deleteOne({ _id: req.params.id });
    res
      .status(200)
      .json({ message: "Profile and associated user deleted successfully" });
  } catch (err) {
    console.error("Error deleting profile:", err); // Log the actual error
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

exports.editProfile = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update profile details
    Object.keys(req.body).forEach((key) => {
      profile[key] = req.body[key];
    });

    await profile.save();
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isSuspended = true;
    await user.save();

    res.status(200).json({ message: "User suspended successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};
