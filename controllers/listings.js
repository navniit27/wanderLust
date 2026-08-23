const Listing = require("../models/listing");
const Review = require("../models/review");
const { cloudinary } = require("../cloudConfig");
const withTransaction = require("../utils/withTransaction");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const LISTINGS_PER_PAGE = 12;

const applyListingFields = (listing, data = {}) => {
    if (data.title !== undefined) listing.title = data.title;
    if (data.description !== undefined) listing.description = data.description;
    if (data.price !== undefined) listing.price = data.price;
    if (data.location !== undefined) listing.location = data.location;
    if (data.country !== undefined) listing.country = data.country;
};


// ==========================================
// SHOW ALL LISTINGS
// ==========================================

module.exports.index = async (req, res) => {

    const { search } = req.query;

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = LISTINGS_PER_PAGE;
    const skip = (page - 1) * limit;

    let filter = {};
    let useTextSearch = false;

    if (typeof search === "string" && search.trim() !== "") {

        const rawSearch = search.trim().slice(0, 100);

        // Multi-word queries use the text index; short queries keep regex for partial matches
        if (rawSearch.includes(" ") && !/[${}]/.test(rawSearch)) {
            filter = { $text: { $search: rawSearch } };
            useTextSearch = true;
        } else {
            const searchTerm = escapeRegExp(rawSearch);

            filter = {
                $or: [
                    { title: { $regex: searchTerm, $options: "i" } },
                    { location: { $regex: searchTerm, $options: "i" } },
                    { country: { $regex: searchTerm, $options: "i" } },
                ],
            };
        }
    }

    const query = Listing.find(filter).skip(skip).limit(limit).lean();

    if (useTextSearch) {
        query.select({
            title: 1,
            price: 1,
            image: 1,
            location: 1,
            country: 1,
            score: { $meta: "textScore" },
        });
        query.sort({ score: { $meta: "textScore" }, createdAt: -1 });
    } else {
        query.select("title price image location country");
        query.sort({ createdAt: -1 });
    }

    const [allListings, total] = await Promise.all([
        query,
        Listing.countDocuments(filter),
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    res.render("listings/index.ejs", {
        allListings,
        search: search || "",
        page,
        totalPages,
        total,
        pageTitle: search
            ? `Search: ${search} · WanderLust`
            : "Explore stays · WanderLust",
    });
};


// ==========================================
// RENDER NEW LISTING FORM
// ==========================================

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { listing: {} });
};


// ==========================================
// SHOW SINGLE LISTING
// ==========================================

module.exports.showListing = async (req, res) => {

    const { id } = req.params;

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            select: "rating comment author createdAt",
            options: { sort: { createdAt: -1 } },
            populate: {
                path: "author",
                select: "username",
            },
        })
        .populate({
            path: "owner",
            select: "username",
        });

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    res.render("listings/show.ejs", {
        listing,
        pageTitle: `${listing.title} · WanderLust`,
        pageDescription: listing.description.slice(0, 160),
        hasUserReviewed: Boolean(
            req.user &&
                listing.reviews.some(
                    (r) => r.author && r.author._id.equals(req.user._id)
                )
        ),
    });
};


// ==========================================
// CREATE LISTING
// ==========================================

module.exports.createPost = async (req, res) => {

    const listingData = req.body.listing || {};

    const listing = new Listing({
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        location: listingData.location,
        country: listingData.country,
        owner: req.user._id,
    });

    if (req.uploadedImage) {
        listing.image = {
            url: req.uploadedImage.url,
            filename: req.uploadedImage.filename,
        };
    }

    try {
        await listing.save();
    } catch (err) {
        if (req.uploadedImage?.filename) {
            try {
                await cloudinary.uploader.destroy(req.uploadedImage.filename, {
                    resource_type: "image",
                    invalidate: true,
                });
            } catch (cleanupErr) {
                console.error(
                    "Cloudinary orphan cleanup failed:",
                    cleanupErr.message
                );
            }
        }
        throw err;
    }

    req.flash("success", "New listing created!");
    res.redirect(`/listings/${listing._id}`);
};


// ==========================================
// RENDER EDIT FORM
// ==========================================

module.exports.renderEditForm = async (req, res) => {

    const listing = req.listing;

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const originalImageUrl =
        listing.image?.url || "/images/default.jpg";

    res.render("listings/edit.ejs", {
        listing,
        originalImageUrl,
    });
};


// ==========================================
// UPDATE LISTING
// ==========================================

module.exports.updateListing = async (req, res) => {

    const listing = req.listing;

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    applyListingFields(listing, req.body.listing);

    let oldImageFilename = null;

    if (req.uploadedImage) {
        oldImageFilename = listing.image?.filename;

        listing.image = {
            url: req.uploadedImage.url,
            filename: req.uploadedImage.filename,
        };
    }

    try {
        await listing.save();
    } catch (err) {
        if (req.uploadedImage?.filename) {
            try {
                await cloudinary.uploader.destroy(req.uploadedImage.filename, {
                    resource_type: "image",
                    invalidate: true,
                });
            } catch (cleanupErr) {
                console.error(
                    "Cloudinary orphan cleanup failed:",
                    cleanupErr.message
                );
            }
        }
        throw err;
    }

    // Delete old Cloudinary image only after DB save succeeds
    if (
        oldImageFilename &&
        oldImageFilename !== "default_image" &&
        oldImageFilename !== req.uploadedImage?.filename
    ) {
        try {
            await cloudinary.uploader.destroy(oldImageFilename, {
                resource_type: "image",
                invalidate: true,
            });
            console.log(
                `Deleted old Cloudinary image: ${oldImageFilename}`
            );
        } catch (error) {
            console.error(
                "Old Cloudinary image deletion failed:",
                error.message
            );
        }
    }

    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${listing._id}`);
};


// ==========================================
// DELETE LISTING
// ==========================================

module.exports.deleteListing = async (req, res) => {

    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const imageFilename = listing.image?.filename;
    const reviewIds = [...listing.reviews];

    await withTransaction(async (session) => {
        const opts = session ? { session } : {};

        await Review.deleteMany(
            { _id: { $in: reviewIds } },
            opts
        );

        await listing.deleteOne(opts);
    });

    if (imageFilename && imageFilename !== "default_image") {
        try {
            await cloudinary.uploader.destroy(imageFilename, {
                resource_type: "image",
                invalidate: true,
            });
            console.log(`Deleted Cloudinary image: ${imageFilename}`);
        } catch (error) {
            console.error(
                "Cloudinary image deletion failed:",
                error.message
            );
        }
    }

    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
};
