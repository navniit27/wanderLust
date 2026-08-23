const sharp = require("sharp");
const { cloudinary } = require("../cloudConfig");

const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_DIMENSION = 8000;
const MAX_MEGAPIXELS = 40_000_000;

/**
 * Validates image magic bytes / dimensions, then uploads to Cloudinary.
 * Expects multer memoryStorage file: { buffer, mimetype, originalname }
 */
module.exports.validateAndUploadImage = async (file) => {
    if (!file?.buffer) {
        throw new Error("No image file provided.");
    }

    let metadata;
    try {
        metadata = await sharp(file.buffer, { failOn: "none" }).metadata();
    } catch {
        throw new Error("Invalid image file. Upload a real JPG, PNG, or WebP.");
    }

    if (!metadata.format || !ALLOWED_FORMATS.has(metadata.format)) {
        throw new Error("Invalid image format. Only JPG, PNG and WebP are allowed.");
    }

    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width < 1 || height < 1) {
        throw new Error("Could not read image dimensions.");
    }

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        throw new Error(
            `Image dimensions too large. Max ${MAX_DIMENSION}px per side.`
        );
    }

    if (width * height > MAX_MEGAPIXELS) {
        throw new Error("Image resolution is too high (megapixel limit).");
    }

    const folder =
        process.env.CLOUDINARY_FOLDER ||
        (process.env.NODE_ENV === "production"
            ? "wanderlust_PROD"
            : "wanderlust_DEV");

    const optimized = await sharp(file.buffer)
        .rotate()
        .resize({
            width: 2000,
            height: 2000,
            fit: "inside",
            withoutEnlargement: true,
        })
        .toFormat(metadata.format === "png" ? "png" : "jpeg", {
            quality: 85,
        })
        .toBuffer();

    const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                format: metadata.format === "png" ? "png" : "jpg",
            },
            (err, result) => {
                if (err) return reject(err);
                resolve(result);
            }
        );
        stream.end(optimized);
    });

    return {
        url: uploaded.secure_url,
        filename: uploaded.public_id,
    };
};
