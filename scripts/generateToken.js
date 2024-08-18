const jwt = require("jsonwebtoken");

const secretKey = "your-secret-key"; // Replace this with your secret key
const token = jwt.sign({ role: "admin" }, secretKey, { expiresIn: "1h" });

console.log("JWT Token:", token);
