const Listing = require("../models/listing");
const Review = require("../models/review");


// ==========================================
// CREATE REVIEW
// ==========================================

module.exports.createReview = async (req, res) => {
    const { id } = req.params;

    // Listing find karo
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // New review create karo
    const review = new Review(req.body.review);

    // Logged-in user ko author banao
    review.author = req.user._id;

    // Listing ke reviews array mein review add karo
    listing.reviews.push(review._id);

    // Dono save karo
    await review.save();
    await listing.save();

    req.flash("success", "New review added!");

    res.redirect(`/listings/${id}`);
};


// ==========================================
// DELETE REVIEW
// ==========================================

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    // Listing find karo
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    // Review delete karo
    const deletedReview = await Review.findByIdAndDelete(reviewId);

    if (!deletedReview) {
        req.flash("error", "Review not found!");
        return res.redirect(`/listings/${id}`);
    }

    // Listing ke reviews array se review ID remove karo
    await Listing.findByIdAndUpdate(id, {
        $pull: {
            reviews: reviewId,
        },
    });

    req.flash("success", "Review deleted!");

    res.redirect(`/listings/${id}`);
};