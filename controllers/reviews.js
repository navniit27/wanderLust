const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");



module.exports.createReview = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const review = new Review(req.body.review);

    review.author = req.user._id;

    await review.save();

    try {
        listing.reviews.push(review._id);
        await listing.save();
    } catch (error) {
        await Review.findByIdAndDelete(review._id).catch((cleanupError) => {
            console.error("Review cleanup failed:", cleanupError.message);
        });
        throw error;
    }

    req.flash("success", "New review added!");

    res.redirect(`/listings/${id}`);
};



module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    const listing = await Listing.findOneAndUpdate(
        { _id: id, reviews: reviewId },
        { $pull: { reviews: reviewId } },
    );

    if (!listing) {
        req.flash("error", "Review not found for this listing!");
        return res.redirect(`/listings/${id}`);
    }

    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
        req.flash("error", "Review was already deleted!");
        return res.redirect(`/listings/${id}`);
    }

    req.flash("success", "Review deleted!");

    res.redirect(`/listings/${id}`);
};
