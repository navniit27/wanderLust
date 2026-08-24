const express = require("express");
const router = express.Router();

const multer = require("multer");
const { storage, cloudinary } = require("../cloudConfig");

const wrapAsync = require("../utils/wrapAsync");

const {
    isLoggedIn,
    csrfProtection,
    isOwner,
    validateListing,
} = require("../middleware");

const listingController = require("../controllers/listings");



const upload = multer({
    storage,

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

const handleUpload = (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
        if (!err) {
            return next();
        }

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

router
    .route("/")
    .get(
        wrapAsync(listingController.index)
    )
    .post(
        isLoggedIn,
        handleUpload,
        csrfProtection,
        validateListing,
        wrapAsync(listingController.createPost)
    );

router.get(
    "/new",
    isLoggedIn,
    listingController.renderNewForm
);

router
    .route("/:id")
    .get(
        wrapAsync(listingController.showListing)
    )

    .put(
        isLoggedIn,

        isOwner,

        handleUpload,

        csrfProtection,

        validateListing,

        wrapAsync(listingController.updateListing)
    )

    .delete(
        isLoggedIn,
        csrfProtection,

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
