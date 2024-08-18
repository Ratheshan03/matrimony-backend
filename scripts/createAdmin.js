const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

mongoose.connect("your-mongodb-uri", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const createAdmin = async () => {
  const email = "s.rathershan03@gmail.com";
  const password = "Ratheshan@03";
  const username = "RatheshanAdmin";

  const hashedPassword = await bcrypt.hash(password, 10);
  const adminUser = new User({
    username,
    email,
    password: hashedPassword,
    role: "admin",
  });

  await adminUser.save();
  console.log("Admin user created!");
  mongoose.disconnect();
};

createAdmin().catch((err) => console.log(err));
