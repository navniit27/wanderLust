const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");
const { cloudinary } = require("../cloudConfig");

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");



module.exports.index = async (req, res) => {

    const { search } = req.query;

    let filter = {};

    if (typeof search === "string" && search.trim() !== "") {

        const searchTerm = escapeRegExp(search.trim().slice(0, 100));

        filter = {
            $or: [
                {
                    title: {
                        $regex: searchTerm,
                        $options: "i",
                    },
                },
                {
                    location: {
                        $regex: searchTerm,
                        $options: "i",
                    },
                },
                {
                    country: {
                        $regex: searchTerm,
                        $options: "i",
                    },
                },
            ],
        };
    }

    const allListings = await Listing.find(filter)
        .select("title price image location country")
        .sort({ createdAt: -1 })
        .lean();

    res.render(
        "listings/index.ejs",
        {
            allListings,
            search: search || "",
        }
    );
};



module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs", { listing: {} });
};



module.exports.showListing = async (req, res) => {

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Listing not found!");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {

        req.flash(
            "error",
            "Listing not found!"
        );

        return res.redirect("/listings");
    }

    res.render(
        "listings/show.ejs",
        {
            listing,
        }
    );
};



module.exports.createPost = async (req, res) => {

    const listingData =
        req.body.listing;

    const listing =
        new Listing(listingData);

    listing.owner =
        req.user._id;



    if (req.file) {

        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };
    }

    await listing.save();

    req.flash(
        "success",
        "New listing created!"
    );

    res.redirect(
        `/listings/${listing._id}`
    );
};



module.exports.renderEditForm = async (
    req,
    res
) => {

    const { id } = req.params;

    const listing = req.listing;

    if (!listing) {

        req.flash(
            "error",
            "Listing not found!"
        );

        return res.redirect(
            "/listings"
        );
    }



    res.render(
        "listings/edit.ejs",
        {
            listing,
        }
    );
};



module.exports.updateListing = async (
    req,
    res
) => {

    const { id } = req.params;

    const listing = req.listing;

    if (!listing) {

        req.flash(
            "error",
            "Listing not found!"
        );

        return res.redirect(
            "/listings"
        );
    }



    Object.assign(
        listing,
        req.body.listing
    );



    let oldImageFilename;

    if (req.file) {

        oldImageFilename =
            listing.image?.filename;

        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };


    }


    await listing.save();

    if (
        req.file &&
        oldImageFilename &&
        oldImageFilename !== "default_image"
    ) {
        try {
            await cloudinary.uploader.destroy(oldImageFilename, {
                resource_type: "image",
                invalidate: true,
            });
        } catch (error) {
            console.error(
                "Old Cloudinary image deletion failed:",
                error.message
            );
        }
    }

    req.flash(
        "success",
        "Listing updated successfully!"
    );

    res.redirect(
        `/listings/${listing._id}`
    );
};



module.exports.deleteListing = async (
    req,
    res
) => {

    const { id } = req.params;

    const listing =
        await Listing.findById(id);

    if (!listing) {

        req.flash(
            "error",
            "Listing not found!"
        );

        return res.redirect(
            "/listings"
        );
    }


    const imageFilename = listing.image?.filename;

    await Review.deleteMany({
        _id: { $in: listing.reviews },
    });

    await listing.deleteOne();

    if (imageFilename && imageFilename !== "default_image") {
        try {
            await cloudinary.uploader.destroy(imageFilename, {
                resource_type: "image",
                invalidate: true,
            });
        } catch (error) {
            console.error(
                "Cloudinary image cleanup failed after listing deletion:",
                error.message
            );
        }
    }

    req.flash(
        "success",
        "Listing deleted successfully!"
    );

    res.redirect(
        "/listings"
    );
};
