require("dotenv").config();

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGO_URL;
const OWNER_ID = process.env.SEED_OWNER_ID || process.argv[2];
const RESET_SEED_DATA = process.env.SEED_RESET === "true";

async function initDB() {
    if (!MONGO_URL) {
        throw new Error("Set ATLASDB_URL or MONGO_URL before running the seed script.");
    }

    if (!OWNER_ID || !mongoose.isValidObjectId(OWNER_ID)) {
        throw new Error("Provide a valid SEED_OWNER_ID in .env or pass the owner ObjectId as the first argument.");
    }

    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    if (RESET_SEED_DATA) {
        await Listing.deleteMany({ owner: OWNER_ID });
        console.log("Existing seed listings for this owner were removed.");
    }

    const listings = initData.data.map((obj) => ({
        ...obj,
        owner: OWNER_ID,
    }));

    await Listing.insertMany(listings);
    console.log(`${listings.length} seed listings inserted.`);
}

initDB()
    .catch((err) => {
        console.error("Seed failed:", err.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
