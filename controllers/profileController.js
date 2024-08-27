const Profile = require("../models/Profile");
const bucket = require("../config/gcs");

// Display all approved profiles
exports.getApprovedProfilesLimited = async (req, res) => {
  try {
    const profiles = await Profile.find({ isApproved: true }).select(
      "name dob height age maritalStatus"
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
    //{ message: "Updated Profile Successfully" }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Upload Profile Photo
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const blob = bucket.file(
      `users/${userId}/profile-photo/${Date.now()}-${req.file.originalname}`
    );
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      // Update or add profile photo URL
      profile.profilePhoto = publicUrl;
      await profile.save();

      res.status(200).json({
        message: "Profile photo uploaded successfully",
        photoUrl: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Upload Additional Photo
exports.uploadAdditionalPhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    const blob = bucket.file(
      `users/${userId}/additional-photos/${Date.now()}-${req.file.originalname}`
    );
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      // Add additional photo URL to the array
      profile.additionalPhotos.push(publicUrl);
      await profile.save();

      res.status(200).json({
        message: "Additional photo uploaded successfully",
        photoUrl: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Remove Photo (Profile or Additional)
exports.removePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const { photoUrl, type } = req.body;

    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Extract the file name from the URL
    const fileName = photoUrl.split("/").pop();
    const blob = bucket.file(
      `users/${userId}/${
        type === "profile" ? "profile-photo" : "additional-photos"
      }/${fileName}`
    );

    if (type === "profile" && profile.profilePhoto === photoUrl) {
      // Remove profile photo
      profile.profilePhoto = "";
    } else if (type === "additional") {
      // Remove photo from additional photos array
      const photoIndex = profile.additionalPhotos.indexOf(photoUrl);
      if (photoIndex > -1) {
        profile.additionalPhotos.splice(photoIndex, 1);
      } else {
        return res.status(404).json({ message: "Photo not found in profile" });
      }
    }

    await profile.save();
    await blob.delete();

    res.status(200).json({ message: "Photo removed successfully" });
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
