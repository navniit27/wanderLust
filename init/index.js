require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const { cloudinary } = require("../cloudConfig.js");

const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGO_URL;

const SEED_OWNER = {
    username: process.env.SEED_USERNAME || "wanderlust",
    email: process.env.SEED_EMAIL || "seed@wanderlust.local",
    password: process.env.SEED_PASSWORD || "Wanderlust@123",
};

const CLOUD_FOLDER =
    process.env.CLOUDINARY_FOLDER ||
    (process.env.NODE_ENV === "production"
        ? "wanderlust_PROD"
        : "wanderlust_DEV");

async function ensureOwner() {
    let user = await User.findOne({
        $or: [
            { username: SEED_OWNER.username },
            { email: SEED_OWNER.email },
        ],
    });

    if (user) {
        console.log(`👤 Using existing owner: ${user.username}`);
        return user;
    }

    user = new User({
        email: SEED_OWNER.email,
        username: SEED_OWNER.username,
        emailVerified: true,
        role: "admin",
    });

    await User.register(user, SEED_OWNER.password);
    console.log(`👤 Created seed owner: ${user.username}`);
    return user;
}

async function uploadToCloudinary(imageUrl, title) {
    const result = await cloudinary.uploader.upload(imageUrl, {
        folder: `${CLOUD_FOLDER}/seed`,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
        context: `title=${title.slice(0, 80)}`,
    });

    return {
        url: result.secure_url,
        filename: result.public_id,
    };
}

async function initDB() {
    if (!MONGO_URL) {
        throw new Error("Set ATLASDB_URL or MONGO_URL in .env");
    }

    if (
        !process.env.CLOUD_NAME ||
        !process.env.CLOUD_API_KEY ||
        !process.env.CLOUD_API_SECRET
    ) {
        throw new Error("Set CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET in .env");
    }

    await mongoose.connect(MONGO_URL);
    console.log("✅ Connected to MongoDB");

    const owner = await ensureOwner();

    // Clear old demo listings + their reviews so seed is clean
    const oldListings = await Listing.find({}).select("_id reviews");
    const reviewIds = oldListings.flatMap((l) => l.reviews || []);

    if (reviewIds.length) {
        await Review.deleteMany({ _id: { $in: reviewIds } });
    }
    await Listing.deleteMany({});
    console.log("🧹 Cleared old listings/reviews");

    const seeded = [];

    for (const [index, item] of initData.data.entries()) {
        process.stdout.write(
            `☁️  Uploading ${index + 1}/${initData.data.length}: ${item.title}... `
        );

        try {
            const image = await uploadToCloudinary(item.image.url, item.title);

            seeded.push({
                title: item.title,
                description: item.description,
                price: item.price,
                location: item.location,
                country: item.country,
                image,
                owner: owner._id,
                reviews: [],
            });

            console.log("done");
        } catch (err) {
            console.log("FAILED");
            console.error(`   → ${err.message}`);
            // Keep Unsplash URL as fallback so listing still shows
            seeded.push({
                title: item.title,
                description: item.description,
                price: item.price,
                location: item.location,
                country: item.country,
                image: {
                    url: item.image.url,
                    filename: "unsplash_fallback",
                },
                owner: owner._id,
                reviews: [],
            });
        }
    }

    await Listing.insertMany(seeded);

    const cloudCount = seeded.filter(
        (l) => l.image.filename !== "unsplash_fallback"
    ).length;

    console.log("\n✅ Seed complete");
    console.log(`   Listings: ${seeded.length}`);
    console.log(`   Cloudinary uploads: ${cloudCount}`);
    console.log(`   Owner login → username: ${SEED_OWNER.username}`);
    console.log(`   Password: ${SEED_OWNER.password}`);
}

initDB()
    .catch((err) => {
        console.error("❌ Seed failed:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
