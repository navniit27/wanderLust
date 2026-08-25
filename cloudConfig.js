const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
});


const storage = new CloudinaryStorage({
    cloudinary,

    params: {
        folder:
            process.env.CLOUDINARY_FOLDER ||
            "wanderlust_DEV",

        resource_type: "image",

        allowed_formats: [
            "jpg",
            "jpeg",
            "png",
            "webp",
        ],

        transformation: [
            {
                quality: "auto",
                fetch_format: "auto",
            },
        ],
    },
});


module.exports = {
    cloudinary,
    storage,
};
