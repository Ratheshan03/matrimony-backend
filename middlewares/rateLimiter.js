const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const redisClient = require("../config/redisClient");

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per window
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
});

module.exports = {
  loginRateLimiter,
};
