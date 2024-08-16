const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // useFindAndModify: false, // Optional: Disable deprecated MongoDB features
      // useCreateIndex: true, // Optional: Enable MongoDB indexes
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

// Test the connection
const testDBConnection = async () => {
  const db = await connectDB();
  if (db) {
    console.log("MongoDB connection is successful!");
  } else {
    console.log("MongoDB connection failed!");
  }
};

module.exports = { connectDB, testDBConnection };
