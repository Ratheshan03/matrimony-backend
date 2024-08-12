const Profile = require("../models/Profile");
const bucket = require("../config/gcs");

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming you have a middleware to attach user
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: userId },
      req.body,
      { new: true }
    );

    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Upload Photo to Google Cloud Storage
exports.uploadPhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const blob = bucket.file(req.file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on("finish", async () => {
      profile.photos.push(blob.name);
      await profile.save();

      res
        .status(200)
        .json({ message: "Photo uploaded successfully", photoUrl: blob.name });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
