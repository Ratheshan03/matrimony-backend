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

    // Find the user's profile
    const profile = await Profile.findOne({ user: userId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // If there's an existing profile photo, delete it from Firebase Storage
    if (profile.profilePhoto) {
      const existingFileName = profile.profilePhoto.split("/").pop();
      const existingBlob = bucket.file(
        `users/${userId}/profile-photo/${existingFileName}`
      );

      try {
        await existingBlob.delete();
      } catch (deleteError) {
        if (deleteError.code === 404) {
          // If file does not exist, log the info and proceed
          console.log(`File not found for deletion: ${existingFileName}`);
        } else {
          throw deleteError; // Re-throw other errors
        }
      }
    }

    // Upload the new profile photo
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

      // Update profile photo URL
      profile.profilePhoto = publicUrl;
      await profile.save();

      res.status(200).json({
        message: "Profile photo uploaded successfully",
        photoUrl: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error in uploadProfilePhoto:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Upload Additional Photo
exports.uploadAdditionalPhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const profile = await Profile.findOne({ user: userId });

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Check if there are already 5 additional photos
    if (profile.additionalPhotos.length >= 5) {
      return res.status(400).json({
        message:
          "You cannot upload more than 5 additional photos. Please delete an existing photo to upload a new one.",
      });
    }

    // Upload the new additional photo
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

      // Initialize additionalPhotos array if necessary
      if (!profile.additionalPhotos) {
        profile.additionalPhotos = [];
      }

      // Add new photo URL
      profile.additionalPhotos.push(publicUrl);
      await profile.save();

      res.status(200).json({
        message: "Additional photo uploaded successfully",
        photoUrl: publicUrl,
      });
    });

    blobStream.end(req.file.buffer);
  } catch (error) {
    console.error("Error in uploadAdditionalPhoto:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete/remove Photos
exports.removePhoto = async (req, res) => {
  try {
    const { userId } = req.user;
    const { photoUrl, type } = req.body;

    // Validate input
    if (!photoUrl || !type) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Find the user's profile
    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Extract the file name from the URL
    const fileName = photoUrl.split("/").pop();
    const filePath =
      type === "profile"
        ? `users/${userId}/profile-photo/${fileName}`
        : `users/${userId}/additional-photos/${fileName}`;
    const blob = bucket.file(filePath);

    // Remove photo from MongoDB and Firebase Storage
    if (type === "profile") {
      if (profile.profilePhoto === photoUrl) {
        profile.profilePhoto = ""; // Remove profile photo URL
        await blob.delete(); // Delete file from Firebase Storage
      } else {
        return res
          .status(404)
          .json({ message: "Profile photo URL does not match" });
      }
    } else if (type === "additional") {
      const photoIndex = profile.additionalPhotos.indexOf(photoUrl);
      if (photoIndex > -1) {
        profile.additionalPhotos.splice(photoIndex, 1); // Remove photo URL from array
        await blob.delete(); // Delete file from Firebase Storage
      } else {
        return res
          .status(404)
          .json({ message: "Photo not found in additional photos" });
      }
    } else {
      return res.status(400).json({ message: "Invalid photo type" });
    }

    // Save profile updates to MongoDB
    await profile.save();

    res.status(200).json({ message: "Photo removed successfully" });
  } catch (error) {
    console.error("Error in removePhoto:", error);
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
