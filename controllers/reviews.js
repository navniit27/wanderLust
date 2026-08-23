const Listing = require("../models/listing");
const Review = require("../models/review");
const withTransaction = require("../utils/withTransaction");

module.exports.createReview = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await withTransaction(async (session) => {
            const listing = session
                ? await Listing.findById(id).session(session)
                : await Listing.findById(id);

            if (!listing) {
                return { missing: true };
            }

            const existing = session
                ? await Review.findOne({
                      listing: id,
                      author: req.user._id,
                  }).session(session)
                : await Review.findOne({
                      listing: id,
                      author: req.user._id,
                  });

            if (existing) {
                return { duplicate: true };
            }

            const review = new Review(req.body.review);
            review.author = req.user._id;
            review.listing = listing._id;

            listing.reviews.push(review._id);

            const opts = session ? { session } : {};
            await review.save(opts);
            await listing.save(opts);

            return { ok: true };
        });

        if (result?.missing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        if (result?.duplicate) {
            req.flash("error", "You already reviewed this listing.");
            return res.redirect(`/listings/${id}`);
        }

        req.flash("success", "New review added!");
        res.redirect(`/listings/${id}`);
    } catch (err) {
        if (err?.code === 11000) {
            req.flash("error", "You already reviewed this listing.");
            return res.redirect(`/listings/${id}`);
        }
        throw err;
    }
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    const result = await withTransaction(async (session) => {
        const opts = session ? { session } : {};

        const listing = await Listing.findOneAndUpdate(
            { _id: id, reviews: reviewId },
            { $pull: { reviews: reviewId } },
            opts
        );

        if (!listing) {
            return { missing: "listing" };
        }

        const deletedReview = await Review.findByIdAndDelete(reviewId, opts);

        if (!deletedReview) {
            return { missing: "review" };
        }

        return { ok: true };
    });

    if (result?.missing === "listing") {
        req.flash("error", "Review not found for this listing!");
        return res.redirect(`/listings/${id}`);
    }

    if (result?.missing === "review") {
        req.flash("error", "Review was already deleted!");
        return res.redirect(`/listings/${id}`);
    }

    req.flash("success", "Review deleted!");
    res.redirect(`/listings/${id}`);
};
