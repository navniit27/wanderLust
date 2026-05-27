const Review = require("../models/review.js");
const Listing = require("../models/listing.js");

module.exports.createReview = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await Promise.all([newReview.save(), listing.save()]);

    req.flash("success", "New Review Created!");
    res.redirect(`/listings/${listing._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Promise.all([
        Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }),
        Review.findByIdAndDelete(reviewId),
    ]);

    req.flash("success", "Review Deleted!");
    res.redirect(`/listings/${id}`);
};