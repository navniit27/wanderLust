const express = require("express");
const router = express.Router({ mergeParams :true });
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/expressError.js");
const { reviewSchema } = require("../schema.js");
const {validateReview, isloggedIn, isReviewAuthor} = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

       //post review routes
router.post("/",isloggedIn, validateReview, wrapAsync(reviewController.createReview));     
   
       //delete review route
router.delete("/:reviewId" ,isloggedIn,isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;