const admin = require("./firebaseConfig");

const bucket = admin.storage().bucket();

module.exports = bucket;
