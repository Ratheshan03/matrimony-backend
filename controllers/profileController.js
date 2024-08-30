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

// Search Profiles with filters within approved profiles
exports.searchProfiles = async (req, res) => {
  try {
    const {
      ageRange,
      gender,
      maritalStatus,
      religion,
      country,
      occupation,
      education,
      heightRange,
      name,
    } = req.query;

    // Initialize search criteria with only approved profiles
    const searchCriteria = {
      isApproved: true,
    };

    // Add optional filters based on user input
    if (ageRange) {
      const [minAge, maxAge] = ageRange.split("-").map(Number);
      const currentYear = new Date().getFullYear();
      searchCriteria.dob = {
        $gte: new Date(currentYear - maxAge, 0, 1),
        $lte: new Date(currentYear - minAge, 11, 31),
      };
    }

    if (gender) searchCriteria.gender = gender;
    if (maritalStatus) searchCriteria.maritalStatus = maritalStatus;
    if (religion) searchCriteria.religion = religion;
    if (country) searchCriteria.country = country;
    if (occupation) searchCriteria.occupation = occupation;
    if (education) searchCriteria.educationalLevel = education;
    if (heightRange) {
      const [minHeight, maxHeight] = heightRange.split("-").map(Number);
      searchCriteria.height = { $gte: minHeight, $lte: maxHeight };
    }
    if (name) searchCriteria.name = new RegExp(name, "i"); // Case-insensitive name search

    const profiles = await Profile.find(searchCriteria).select(
      "name dob gender maritalStatus height country religion occupation educationalLevel profilePhoto"
    );

    res.status(200).json(profiles);
  } catch (error) {
    console.error("Error in searchProfiles:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// View Profile Details (for logged-in users only)
exports.getProfileDetails = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming `req.user` contains authenticated user info
    const profileId = req.params.id;

    // Fetch the profile without populating the `user` field
    const profile = await Profile.findById(profileId).select("-user");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    // Check if profile is approved or the user owns it
    if (!profile.isApproved && profile.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Access Denied" });
    }

    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in getProfileDetails:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Mark a Profile as Favorite
exports.markAsFavorite = async (req, res) => {
  try {
    const { userId } = req.user;
    const { profileId } = req.body; // The profile to be marked as favorite

    // console.log("User ID:", userId);
    // console.log("Profile ID to mark as favorite:", profileId);

    // Find the user's profile by user ID
    const userProfile = await Profile.findOne({ user: userId });

    if (!userProfile) {
      console.log("User profile not found for user ID:", userId);
      return res.status(404).json({ message: "User profile not found" });
    }

    // Ensure the profile to be marked as favorite exists
    const profileToFavorite = await Profile.findById(profileId);
    if (!profileToFavorite) {
      return res
        .status(404)
        .json({ message: "Profile to be favorited not found" });
    }

    // Check if the profile is already in favorites
    if (userProfile.favorites.includes(profileId)) {
      return res
        .status(400)
        .json({ message: "Profile is already in favorites" });
    }

    // Add the profile to favorites
    userProfile.favorites.push(profileId);
    await userProfile.save();

    res
      .status(200)
      .json({ message: "Profile marked as favorite successfully" });
  } catch (error) {
    console.error("Error in markAsFavorite:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// View Favorite Profiles
exports.viewFavoriteProfiles = async (req, res) => {
  try {
    const { userId } = req.user;

    // Find the user's profile by user ID
    const userProfile = await Profile.findOne({ user: userId }).populate(
      "favorites",
      "name dob gender maritalStatus profilePhoto"
    );

    // console.log("User Profile:", userProfile);
    // console.log("Favorites:", userProfile?.favorites);

    if (!userProfile) {
      return res.status(404).json({ message: "User profile not found" });
    }

    res.status(200).json(userProfile.favorites);
  } catch (error) {
    console.error("Error in viewFavoriteProfiles:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
