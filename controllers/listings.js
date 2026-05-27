const Listing = require("../models/listing");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800";

module.exports.index = async (req, res) => {
    const allListings = await Listing.find({}).select("title price image location country");
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({ path: "reviews", populate: { path: "author" } })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createPost = async (req, res) => {
    // FIX #3: let → const
    const url = req.file ? req.file.path : DEFAULT_IMAGE;
    const filename = req.file ? req.file.filename : "default_image";

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    // FIX #3: let → const
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist!");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    if (originalImageUrl && originalImageUrl.includes("/upload")) {
        originalImageUrl = originalImageUrl.replace(
            "/upload",
            "/upload/ar_1.0,c_fill,h_250/bo_5px_solid_lightblue"
        );
    }

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;

    // FIX #4: { new: true } add kiya
    const listing = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { new: true }
    );

    if (req.file) {
        listing.image = { url: req.file.path, filename: req.file.filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;

    // FIX #1: console.log hata diya
    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};