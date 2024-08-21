const Profile = require("../models/Profile");
const bucket = require("../config/gcs");

// Display all approved profiles
exports.getApprovedProfilesLimited = async (req, res) => {
  try {
    const profiles = await Profile.find({ isApproved: true }).select(
      "name height age maritalStatus"
    );
    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Display all approved profiles with full info
exports.getApprovedProfilesFull = async (req, res) => {
  try {
    const profiles = await Profile.find({ isApproved: true }).populate("user");
    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const { userId } = req.user;
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

// Remove Photo from Google Cloud Storage
exports.removePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const { photoName } = req.body;

    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Remove photo from the list
    const photoIndex = profile.photos.indexOf(photoName);
    if (photoIndex > -1) {
      profile.photos.splice(photoIndex, 1);
      await profile.save();

      // Delete photo from Google Cloud Storage
      const blob = bucket.file(photoName);
      await blob.delete();

      res.status(200).json({ message: "Photo removed successfully" });
    } else {
      res.status(404).json({ message: "Photo not found in profile" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Search Profiles
exports.searchProfiles = async (req, res) => {
  try {
    const searchCriteria = req.query;
    const profiles = await Profile.find({
      ...searchCriteria,
      isApproved: true,
    }).select("name height age maritalStatus");

    res.status(200).json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// View Profile Details
exports.getProfileDetails = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id).populate("user");
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Mark Profile as Favorite
exports.markAsFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findById(req.params.id);
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.favorites.push(userId);
    await profile.save();

    res.status(200).json({ message: "Profile marked as favorite" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
