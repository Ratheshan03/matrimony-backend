// redisClient.js
const redis = require("redis");

// Create a Redis client
const redisClient = redis.createClient({
  socket: {
    host: "127.0.0.1", // Ensure this matches your Docker setup
    port: 6379,
  },
});

// Handle connection errors
redisClient.on("error", (err) => console.log("Redis Client Error:", err));

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Error connecting to Redis:", error);
  }
})();

module.exports = redisClient;
