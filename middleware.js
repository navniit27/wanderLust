const { listingSchema, reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");
const Listing = require("./models/listing");
const Review = require("./models/review");
const { cloudinary } = require("./cloudConfig");


// ==========================================
// CHECK LOGIN
// ==========================================

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;

        req.flash(
            "error",
            "You must be logged in to perform this action."
        );

        return res.redirect("/login");
    }

    next();
};


// ==========================================
// SAVE RETURN URL
// ==========================================

module.exports.saveReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }

    next();
};


// ==========================================
// CHECK LISTING OWNER
// ==========================================

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        if (!listing.owner.equals(req.user._id)) {
            req.flash(
                "error",
                "You don't have permission to do that!"
            );

            return res.redirect(`/listings/${id}`);
        }

        req.listing = listing;

        next();
    } catch (error) {
        next(error);
    }
};


// ==========================================
// VALIDATE LISTING
// ==========================================

module.exports.validateListing = async (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    // Validation passed
    if (!error) {
        return next();
    }

    // Remove uploaded image if validation fails
    if (req.file?.filename) {
        try {
            await cloudinary.uploader.destroy(
                req.file.filename,
                {
                    resource_type: "image",
                    invalidate: true,
                }
            );

            console.log(
                `Deleted invalid upload from Cloudinary: ${req.file.filename}`
            );
        } catch (cloudinaryError) {
            console.error(
                "Cloudinary cleanup failed:",
                cloudinaryError.message
            );
        }
    }

    const errMsg = error.details
        .map((detail) => detail.message)
        .join(", ");

    // ======================================
    // NEW LISTING
    // ======================================

    if (req.method === "POST") {
        return res.status(400).render(
            "listings/new.ejs",
            {
                listing: req.body.listing || {},
                validationError: errMsg,
            }
        );
    }

    // ======================================
    // EDIT LISTING
    // ======================================

    if (req.method === "PUT") {
        const listing = await Listing.findById(req.params.id);

        if (!listing) {
            return next(
                new ExpressError(
                    404,
                    "Listing not found!"
                )
            );
        }

        Object.assign(
            listing,
            req.body.listing || {}
        );

        return res.status(400).render(
            "listings/edit.ejs",
            {
                listing,
                validationError: errMsg,
            }
        );
    }

    return next(
        new ExpressError(
            400,
            errMsg
        )
    );
};


// ==========================================
// VALIDATE REVIEW
// ==========================================

module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);

    if (!error) {
        return next();
    }

    const errMsg = error.details
        .map((detail) => detail.message)
        .join(", ");

    return next(
        new ExpressError(
            400,
            errMsg
        )
    );
};


// ==========================================
// CHECK REVIEW OWNER
// ==========================================

module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        const review = await Review.findById(reviewId);

        if (!review) {
            req.flash("error", "Review not found!");
            return res.redirect(`/listings/${id}`);
        }

        if (!review.author.equals(req.user._id)) {
            req.flash(
                "error",
                "You don't have permission to do that!"
            );

            return res.redirect(`/listings/${id}`);
        }

        next();
    } catch (error) {
        next(error);
    }
};


// ==========================================
// HANDLE ASYNC ERRORS
// ==========================================

module.exports.wrapAsync = (fn) => {
    return function (req, res, next) {
        Promise.resolve(
            fn(req, res, next)
        ).catch(next);
    };
};