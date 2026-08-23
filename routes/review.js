const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");
const { writeLimiter } = require("../utils/rateLimiters");

const {
    isLoggedIn,
    validateReview,
    canDeleteReview,
    requireEmailVerified,
} = require("../middleware");

const reviewController = require("../controllers/reviews");

router.post(
    "/",
    isLoggedIn,
    requireEmailVerified,
    writeLimiter,
    validateReview,
    wrapAsync(reviewController.createReview)
);

router.delete(
    "/:reviewId",
    isLoggedIn,
    writeLimiter,
    canDeleteReview,
    wrapAsync(reviewController.deleteReview)
);

module.exports = router;
