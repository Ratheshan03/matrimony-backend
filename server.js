const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cors = require("cors");
const { connectDB, testDBConnection } = require("./config/db");

// Load environment variables
dotenv.config();

// Test MongoDB Connection
// testDBConnection();

// Connect to the database
connectDB();

const app = express();

// Middleware
app.use(express.json());
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(morgan("dev"));

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
// app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/profiles", require("./routes/profileRoutes"));
// app.use("/api/matchmaking", require("./routes/matchmaking"));

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
