const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");

const Review = require("../models/review");
const Listing = require("../models/listing");

const {
    isLoggedIn,
    validateReview,
    isReviewAuthor,
} = require("../middleware");

const reviewController = require("../controllers/reviews");


// ==========================================
// CREATE REVIEW
// ==========================================

router.post(
    "/",
    isLoggedIn,
    validateReview,
    wrapAsync(reviewController.createReview)
);


// ==========================================
// DELETE REVIEW
// ==========================================

router.delete(
    "/:reviewId",
    isLoggedIn,
    isReviewAuthor,
    wrapAsync(reviewController.deleteReview)
);


module.exports = router;