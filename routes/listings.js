const express = require("express");
const router = express.Router();

const multer = require("multer");
const { cloudinary } = require("../cloudConfig");
const { validateAndUploadImage } = require("../utils/uploadImage");

const wrapAsync = require("../utils/wrapAsync");
const { writeLimiter } = require("../utils/rateLimiters");

const {
    isLoggedIn,
    isOwner,
    validateListing,
    requireEmailVerified,
} = require("../middleware");

const listingController = require("../controllers/listings");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
    },
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

const cleanupUploadedImage = async (req) => {
    if (!req.uploadedImage?.filename) {
        return;
    }

    try {
        await cloudinary.uploader.destroy(req.uploadedImage.filename, {
            resource_type: "image",
            invalidate: true,
        });
    } catch (error) {
        console.error("Cloudinary cleanup failed:", error.message);
    }
};

const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).render("error.ejs", {
                        err: {
                            statusCode: 400,
                            message: "Image size must be less than 5 MB.",
                        },
                    });
                }
            }

            return res.status(400).render("error.ejs", {
                err: {
                    statusCode: 400,
                    message: err.message || "Image upload failed.",
                },
            });
        }

        if (!req.file) {
            return next();
        }

        try {
            req.uploadedImage = await validateAndUploadImage(req.file);
            return next();
        } catch (uploadErr) {
            return res.status(400).render("error.ejs", {
                err: {
                    statusCode: 400,
                    message: uploadErr.message || "Image upload failed.",
                },
            });
        }
    });
};

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isLoggedIn,
        requireEmailVerified,
        writeLimiter,
        handleUpload,
        validateListing,
        wrapAsync(listingController.createPost)
    );

router.get(
    "/new",
    isLoggedIn,
    requireEmailVerified,
    listingController.renderNewForm
);

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(
        isLoggedIn,
        writeLimiter,
        isOwner,
        handleUpload,
        validateListing,
        wrapAsync(listingController.updateListing)
    )
    .delete(
        isLoggedIn,
        writeLimiter,
        isOwner,
        wrapAsync(listingController.deleteListing)
    );

router.get(
    "/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.renderEditForm)
);

module.exports = router;
module.exports.cleanupUploadedImage = cleanupUploadedImage;
