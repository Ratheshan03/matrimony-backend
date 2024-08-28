const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    createdBy: String,
    name: String,
    dob: Date,
    gender: String,
    maritalStatus: String,
    height: Number,
    weight: Number,
    complexion: String,
    religion: String,
    country: String,
    motherTongue: String,
    mobile: String,
    educationalLevel: String,
    qualifications: String,
    occupation: String,
    occupationSector: String,
    ethnicGroup: String,
    fatherDetails: {
      name: String,
      occupation: String,
    },
    motherDetails: {
      name: String,
      occupation: String,
    },
    siblingDetails: {
      noOfSiblings: Number,
      siblings: [
        {
          name: String,
          occupation: String,
        },
      ],
    },
    package: String,
    profilePhoto: String,
    additionalPhotos: [{ type: String }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
