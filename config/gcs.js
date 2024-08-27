const admin = require("firebase-admin");

const serviceAccount = require("../path/to/your/serviceAccountKey.json"); // Update this path to your Firebase service account key file

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "matrimony-site-7fa15.appspot.com", // Your Firebase Storage bucket name
});

const bucket = admin.storage().bucket();

module.exports = bucket;
