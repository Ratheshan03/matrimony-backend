const bcrypt = require("bcryptjs");

const testPassword = async () => {
  const plainPassword = "0bj94fpd";
  const storedHash =
    "$2a$10$ea2l.Xwc6EllOocXg16rlutBWsvW.V1SDK15DYo8ZMVws5Cg/ocBy";

  const isMatch = await bcrypt.compare(plainPassword, storedHash);
  console.log(isMatch ? "Password matches!" : "Password does not match.");
};

testPassword();
