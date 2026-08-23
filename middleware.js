const {
    listingSchema,
    reviewSchema,
    signupSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} = require("./schema");
const ExpressError = require("./utils/expressError");
const Listing = require("./models/listing");
const Review = require("./models/review");
const { cloudinary } = require("./cloudConfig");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash("error", "You must be logged in to perform this action.");
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

module.exports.isAdmin = (req, res, next) => {
    if (!req.isAuthenticated() || !req.user.isAdmin()) {
        req.flash("error", "Admin access required.");
        return res.redirect("/listings");
    }
    next();
};

module.exports.requireEmailVerified = (req, res, next) => {
    if (process.env.NODE_ENV === "test") {
        return next();
    }

    if (req.user?.emailVerified || req.user?.isAdmin()) {
        return next();
    }

    req.flash(
        "error",
        "Please verify your email before doing that. Check your inbox or request a new link."
    );
    return res.redirect("/listings");
};

module.exports.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const listing = await Listing.findById(id);

        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        const isOwnerUser = listing.owner.equals(req.user._id);
        const isAdminUser = req.user.isAdmin();

        if (!isOwnerUser && !isAdminUser) {
            req.flash("error", "You don't have permission to do that!");
            return res.redirect(`/listings/${id}`);
        }

        req.listing = listing;
        next();
    } catch (error) {
        next(error);
    }
};

module.exports.validateListing = async (req, res, next) => {
    const { error, value } = listingSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (!error) {
        req.body = value;
        return next();
    }

    if (req.uploadedImage?.filename) {
        try {
            await cloudinary.uploader.destroy(req.uploadedImage.filename, {
                resource_type: "image",
                invalidate: true,
            });
        } catch (cloudinaryError) {
            console.error("Cloudinary cleanup failed:", cloudinaryError.message);
        }
    }

    const errMsg = error.details.map((detail) => detail.message).join(", ");

    if (req.method === "POST") {
        return res.status(400).render("listings/new.ejs", {
            listing: req.body.listing || {},
            validationError: errMsg,
        });
    }

    if (req.method === "PUT") {
        const listing = await Listing.findById(req.params.id);
        if (!listing) {
            return next(new ExpressError(404, "Listing not found!"));
        }

        const incoming = req.body.listing || {};
        if (incoming.title !== undefined) listing.title = incoming.title;
        if (incoming.description !== undefined) {
            listing.description = incoming.description;
        }
        if (incoming.price !== undefined) listing.price = incoming.price;
        if (incoming.location !== undefined) listing.location = incoming.location;
        if (incoming.country !== undefined) listing.country = incoming.country;

        return res.status(400).render("listings/edit.ejs", {
            listing,
            validationError: errMsg,
        });
    }

    return next(new ExpressError(400, errMsg));
};

module.exports.validateReview = (req, res, next) => {
    const { error, value } = reviewSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (!error) {
        req.body = value;
        return next();
    }

    const errMsg = error.details.map((detail) => detail.message).join(", ");
    return next(new ExpressError(400, errMsg));
};

module.exports.validateSignup = (req, res, next) => {
    const { error, value } = signupSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (!error) {
        req.body = value;
        return next();
    }

    const errMsg = error.details.map((detail) => detail.message).join(", ");
    req.flash("error", errMsg);
    return res.redirect("/signup");
};

module.exports.validateForgotPassword = (req, res, next) => {
    const { error, value } = forgotPasswordSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (!error) {
        req.body = value;
        return next();
    }

    req.flash("error", error.details.map((d) => d.message).join(", "));
    return res.redirect("/forgot-password");
};

module.exports.validateResetPassword = (req, res, next) => {
    const { error, value } = resetPasswordSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (!error) {
        req.body = value;
        return next();
    }

    req.flash("error", error.details.map((d) => d.message).join(", "));
    return res.redirect(`/reset-password/${req.params.token}`);
};

module.exports.canDeleteReview = async (req, res, next) => {
    try {
        const { id, reviewId } = req.params;

        const [review, listing] = await Promise.all([
            Review.findById(reviewId),
            Listing.findById(id).select("reviews owner"),
        ]);

        if (!review) {
            req.flash("error", "Review not found!");
            return res.redirect(`/listings/${id}`);
        }

        if (!listing || !listing.reviews.some((r) => r.equals(reviewId))) {
            req.flash("error", "Review not found for this listing!");
            return res.redirect(`/listings/${id}`);
        }

        const isAuthor = review.author.equals(req.user._id);
        const isListingOwner = listing.owner.equals(req.user._id);
        const isAdminUser = req.user.isAdmin();

        if (!isAuthor && !isListingOwner && !isAdminUser) {
            req.flash("error", "You don't have permission to do that!");
            return res.redirect(`/listings/${id}`);
        }

        req.review = review;
        req.listing = listing;
        next();
    } catch (error) {
        next(error);
    }
};

// Back-compat alias
module.exports.isReviewAuthor = module.exports.canDeleteReview;

module.exports.wrapAsync = (fn) => {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
