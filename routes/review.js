const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync");

const {
    isLoggedIn,
    csrfProtection,
    validateReview,
    isReviewAuthor,
} = require("../middleware");

const reviewController = require("../controllers/reviews");



router.post(
    "/",
    isLoggedIn,
    csrfProtection,
    validateReview,
    wrapAsync(reviewController.createReview)
);



router.delete(
    "/:reviewId",
    isLoggedIn,
    csrfProtection,
    isReviewAuthor,
    wrapAsync(reviewController.deleteReview)
);


module.exports = router;
