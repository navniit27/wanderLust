const crypto = require("crypto");
const mongoose = require("mongoose");
const { listingSchema, reviewSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");
const Listing = require("./models/listing");
const Review = require("./models/review");
const { cloudinary } = require("./cloudConfig");



module.exports.csrfToken = (req, res, next) => {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
    }

    res.locals.csrfToken = req.session.csrfToken;
    next();
};

module.exports.csrfProtection = async (req, res, next) => {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];

    if (safeMethods.includes(req.method)) {
        return next();
    }

    const submittedToken =
        req.body?._csrf ||
        req.headers["x-csrf-token"];

    const sessionToken = req.session.csrfToken;

    if (!submittedToken || !sessionToken) {
        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename, {
                    resource_type: "image",
                    invalidate: true,
                });
            } catch (error) {
                console.error("CSRF cleanup failed:", error.message);
            }
        }

        return next(
            new ExpressError(403, "Invalid or missing security token. Please refresh the page and try again.")
        );
    }

    const submittedBuffer = Buffer.from(String(submittedToken));
    const sessionBuffer = Buffer.from(String(sessionToken));

    if (
        submittedBuffer.length !== sessionBuffer.length ||
        !crypto.timingSafeEqual(submittedBuffer, sessionBuffer)
    ) {
        if (req.file?.filename) {
            try {
                await cloudinary.uploader.destroy(req.file.filename, {
                    resource_type: "image",
                    invalidate: true,
                });
            } catch (error) {
                console.error("CSRF cleanup failed:", error.message);
            }
        }

        return next(
            new ExpressError(403, "Invalid security token. Please refresh the page and try again.")
        );
    }

    if (req.body && typeof req.body === "object") {
        delete req.body._csrf;
    }

    next();
};



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



module.exports.saveReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }

    next();
};



module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return next(new ExpressError(404, "Listing not found!"));
        }

        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        if (!listing.owner || !listing.owner.equals(req.user._id)) {
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



module.exports.validateListing = async (req, res, next) => {
    const { error } = listingSchema.validate(req.body);

    if (!error) {
        return next();
    }

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


    if (req.method === "POST") {
        return res.status(400).render(
            "listings/new.ejs",
            {
                listing: req.body.listing || {},
                validationError: errMsg,
            }
        );
    }


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



module.exports.isReviewAuthor = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(reviewId)
        ) {
            return next(new ExpressError(404, "Review not found!"));
        }

        const listing = await Listing.findById(id).select("reviews");

        if (!listing || !listing.reviews.some((item) => item.equals(reviewId))) {
            req.flash("error", "Review not found for this listing!");
            return res.redirect(`/listings/${id}`);
        }

        const review = await Review.findById(reviewId);

        if (!review) {
            req.flash("error", "Review not found!");
            return res.redirect(`/listings/${id}`);
        }

        if (!review.author || !review.author.equals(req.user._id)) {
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

