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

            req.flash(
                "error",
                "Listing not found!"
            );

            return res.redirect("/listings");
        }


        if (
            !listing.owner ||
            !listing.owner.equals(req.user._id)
        ) {

            req.flash(
                "error",
                "You don't have permission to do that!"
            );

            return res.redirect(
                `/listings/${id}`
            );
        }


        // Make listing available to later middleware/controllers
        req.listing = listing;

        next();

    } catch (error) {

        next(error);
    }
};


// ==========================================
// VALIDATE LISTING
// ==========================================

module.exports.validateListing = async (
    req,
    res,
    next
) => {

    try {

        const { error } =
            listingSchema.validate(
                req.body
            );


        // Validation successful
        if (!error) {
            return next();
        }


        // ======================================
        // DELETE INVALID CLOUDINARY UPLOAD
        // ======================================

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


        // ======================================
        // JOI ERROR
        // ======================================

        const errMsg =
            error.details
                .map(
                    (detail) =>
                        detail.message
                )
                .join(", ");


        return next(
            new ExpressError(
                400,
                errMsg
            )
        );

    } catch (error) {

        next(error);
    }
};


// ==========================================
// VALIDATE REVIEW
// ==========================================

module.exports.validateReview = (
    req,
    res,
    next
) => {

    const { error } =
        reviewSchema.validate(
            req.body
        );


    if (!error) {
        return next();
    }


    const errMsg =
        error.details
            .map(
                (detail) =>
                    detail.message
            )
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

module.exports.isReviewAuthor = async (
    req,
    res,
    next
) => {

    try {

        const {
            id,
            reviewId,
        } = req.params;


        const review =
            await Review.findById(
                reviewId
            );


        if (!review) {

            req.flash(
                "error",
                "Review not found!"
            );

            return res.redirect(
                `/listings/${id}`
            );
        }


        if (
            !review.author ||
            !review.author.equals(
                req.user._id
            )
        ) {

            req.flash(
                "error",
                "You don't have permission to do that!"
            );

            return res.redirect(
                `/listings/${id}`
            );
        }


        req.review = review;

        next();

    } catch (error) {

        next(error);
    }
};


// ==========================================
// HANDLE ASYNC ERRORS
// ==========================================

module.exports.wrapAsync = (fn) => {

    return function (
        req,
        res,
        next
    ) {

        Promise
            .resolve(
                fn(req, res, next)
            )
            .catch(next);
    };
};