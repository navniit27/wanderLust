const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");

const wrapAsync = require("../utils/wrapAsync");

const {
    isLoggedIn,
    isOwner,
    validateListing,
} = require("../middleware");

const listingController = require("../controllers/listings");


// ==========================================
// MULTER CONFIGURATION
// ==========================================

const upload = multer({
    storage,

    // Maximum image size = 5 MB
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },

    // Only allow image files
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new Error(
                    "Invalid image format. Only JPG, PNG and WebP images are allowed."
                )
            );
        }

        cb(null, true);
    },
});


// ==========================================
// CLOUDINARY CLEANUP HELPER
// ==========================================

const cleanupUploadedImage = async (req) => {
    if (!req.file?.filename) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(req.file.filename, {
            resource_type: "image",
            invalidate: true,
        });

        console.log(
            `Cleaned up Cloudinary image: ${req.file.filename}`
        );
    } catch (error) {
        console.error(
            "Cloudinary cleanup failed:",
            error.message
        );
    }
};


// ==========================================
// MULTER ERROR HANDLER
// ==========================================

const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
        if (!err) {
            return next();
        }

        // If Multer/Cloudinary already uploaded something,
        // try to remove it.
        if (req.file?.filename) {
            await cleanupUploadedImage(req);
        }

        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).render("error.ejs", {
                    err: {
                        statusCode: 400,
                        message:
                            "Image size must be less than 5 MB.",
                    },
                });
            }

            return res.status(400).render("error.ejs", {
                err: {
                    statusCode: 400,
                    message: `Image upload failed: ${err.message}`,
                },
            });
        }

        return res.status(400).render("error.ejs", {
            err: {
                statusCode: 400,
                message: err.message || "Image upload failed.",
            },
        });
    });
};


// ==========================================
// CREATE LISTING
// ==========================================

router
    .route("/")
    .get(
        wrapAsync(listingController.index)
    )

    .post(
        isLoggedIn,

        // 1. Upload image
        handleUpload,

        // 2. Validate listing data
        validateListing,

        // 3. Create listing
        wrapAsync(listingController.createPost)
    );


// ==========================================
// NEW LISTING FORM
// ==========================================

router.get(
    "/new",
    isLoggedIn,
    listingController.renderNewForm
);


// ==========================================
// SHOW / EDIT / UPDATE / DELETE
// ==========================================

router
    .route("/:id")
    .get(
        wrapAsync(listingController.showListing)
    )

    .put(
        isLoggedIn,

        // Check ownership BEFORE upload
        isOwner,

        // Upload image
        handleUpload,

        // Validate listing
        validateListing,

        // Update listing
        wrapAsync(listingController.updateListing)
    )

    .delete(
        isLoggedIn,

        // Check ownership BEFORE deleting
        isOwner,

        // Delete listing + Cloudinary image
        wrapAsync(listingController.deleteListing)
    );


// ==========================================
// EDIT FORM
// ==========================================

router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);


module.exports = router;