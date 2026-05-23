const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const Listing = require("../models/listing.js");
const { isloggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require('multer');
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

// MAIN ROUTES - GET (Index) & POST (Create)
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isloggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingController.createPost));

// NEW ROUTE - Hamesha ":id" se upar hona chahiye taaki "new" ko id na samajh le
router.get("/new", isloggedIn, listingController.renderNewForm);    

// EDIT ROUTE - Hamesha ":id" ke functional standard se alag handle hota hai
router.get("/:id/edit", isloggedIn, isOwner, wrapAsync(listingController.renderEditForm)); 

// SPECIFIC ID ROUTES - GET (Show), PUT (Update), DELETE (Delete)
router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isloggedIn, isOwner, upload.single("image"), validateListing, wrapAsync(listingController.updateListing))
    .delete(isloggedIn, isOwner, wrapAsync(listingController.deleteListing));

module.exports = router;