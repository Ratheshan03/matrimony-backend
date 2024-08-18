const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    isSuspended: {
      type: Boolean,
      default: false, // Default is false, meaning the user is not suspended by default
    },
  },
  { timestamps: true }
);

// Encrypt password before saving the user
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

module.exports = mongoose.model("User", UserSchema);
