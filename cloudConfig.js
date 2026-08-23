const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");


// ==========================================
// CLOUDINARY CONFIGURATION
// ==========================================

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


// ==========================================
// MULTER + CLOUDINARY STORAGE
// ==========================================

const storage = new CloudinaryStorage({
    cloudinary,

    params: {
        folder:
            process.env.CLOUDINARY_FOLDER ||
            (process.env.NODE_ENV === "production"
                ? "wanderlust_PROD"
                : "wanderlust_DEV"),

        resource_type: "image",

        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
        ],

        // Cloudinary automatically optimizes
        // uploaded images.
        transformation: [
            {
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    },
});


// ==========================================
// EXPORT
// ==========================================

module.exports = {
    cloudinary,
    storage,
};