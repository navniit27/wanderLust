const Listing = require("../models/listing");
const { cloudinary } = require("../cloudConfig");


// ==========================================
// SHOW ALL LISTINGS
// ==========================================

module.exports.index = async (req, res) => {

    const { search } = req.query;

    let filter = {};

    if (search && search.trim() !== "") {

        const searchTerm = search.trim();

        filter = {
            $or: [
                {
                    title: {
                        $regex: searchTerm,
                        $options: "i"
                    }
                },
                {
                    location: {
                        $regex: searchTerm,
                        $options: "i"
                    }
                },
                {
                    country: {
                        $regex: searchTerm,
                        $options: "i"
                    }
                }
            ]
        };

    }

    const allListings = await Listing.find(filter)
        .select("title price image location country")
        .sort({ _id: -1 });

    res.render(
        "listings/index.ejs",
        {
            allListings,
            search: search || ""
        }
    );
};


// ==========================================
// RENDER NEW LISTING FORM
// ==========================================

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};


// ==========================================
// SHOW SINGLE LISTING
// ==========================================

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

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


// ==========================================
// CREATE LISTING
// ==========================================

module.exports.createPost = async (req, res) => {
    const listingData = req.body.listing;

    const listing = new Listing(
        listingData
    );

    // Logged-in user becomes owner
    listing.owner = req.user._id;


    // ======================================
    // CLOUDINARY IMAGE
    // ======================================

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


// ==========================================
// RENDER EDIT FORM
// ==========================================

module.exports.renderEditForm = async (
    req,
    res
) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash(
            "error",
            "Listing not found!"
        );

        return res.redirect("/listings");
    }

    res.render(
        "listings/edit.ejs",
        {
            listing,
        }
    );
};


// ==========================================
// UPDATE LISTING
// ==========================================

module.exports.updateListing = async (
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

        return res.redirect("/listings");
    }


    // ======================================
    // UPDATE TEXT DATA
    // ======================================

    Object.assign(
        listing,
        req.body.listing
    );


    // ======================================
    // UPDATE IMAGE
    // ======================================

    if (req.file) {
        const oldImageFilename =
            listing.image?.filename;

        listing.image = {
            url: req.file.path,
            filename: req.file.filename,
        };


        // Delete old Cloudinary image
        if (
            oldImageFilename &&
            oldImageFilename !==
                "default_image"
        ) {
            try {
                await cloudinary.uploader.destroy(
                    oldImageFilename,
                    {
                        resource_type: "image",
                        invalidate: true,
                    }
                );

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
    }


    await listing.save();

    req.flash(
        "success",
        "Listing updated successfully!"
    );

    res.redirect(
        `/listings/${listing._id}`
    );
};


// ==========================================
// DELETE LISTING
// ==========================================

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

        return res.redirect("/listings");
    }


    // ======================================
    // DELETE CLOUDINARY IMAGE
    // ======================================

    const imageFilename =
        listing.image?.filename;

    if (
        imageFilename &&
        imageFilename !== "default_image"
    ) {
        try {
            await cloudinary.uploader.destroy(
                imageFilename,
                {
                    resource_type: "image",
                    invalidate: true,
                }
            );

            console.log(
                `Deleted Cloudinary image: ${imageFilename}`
            );
        } catch (error) {
            console.error(
                "Cloudinary image deletion failed:",
                error.message
            );
        }
    }


    // ======================================
    // DELETE LISTING
    // ======================================

    await Listing.findByIdAndDelete(id);

    req.flash(
        "success",
        "Listing deleted successfully!"
    );

    res.redirect("/listings");
};