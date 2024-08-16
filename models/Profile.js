const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
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
  fatherDetails: String,
  motherDetails: String,
  siblingDetails: String,
  package: String,
  photos: [{ type: String }], // URLs for photos will be stored here
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Profile", profileSchema);
