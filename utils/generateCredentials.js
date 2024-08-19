const bcrypt = require("bcryptjs");
const User = require("../models/User");

const generateUsername = async (name, email) => {
  let username = `${name.split(" ")[0]}${email.split("@")[0]}`;
  let isUnique = false;
  let counter = 1;

  while (!isUnique) {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      username = `${username}${counter}`;
      counter++;
    } else {
      isUnique = true;
    }
  }

  return username;
};

const generatePassword = async () => {
  const tempPassword = Math.random().toString(36).slice(-8); // generate a random 8-character password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(tempPassword, salt);
  return { tempPassword, hashedPassword };
};

module.exports = { generateUsername, generatePassword };
