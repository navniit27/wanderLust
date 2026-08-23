const rateLimit = require("express-rate-limit");

module.exports.authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many attempts. Please try again after 15 minutes.",
});

module.exports.writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests. Please slow down and try again.",
});
