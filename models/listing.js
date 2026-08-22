const mongoose = require("mongoose");

const { Schema } = mongoose;


// ==========================================
// LISTING SCHEMA
// ==========================================

const listingSchema = new Schema(
    {
        // ============================
        // BASIC LISTING INFORMATION
        // ============================

        title: {
            type: String,
            required: [true, "Title is required."],
            trim: true,
            minlength: [3, "Title must be at least 3 characters."],
            maxlength: [100, "Title cannot exceed 100 characters."],
        },

        description: {
            type: String,
            required: [true, "Description is required."],
            trim: true,
            minlength: [
                10,
                "Description must be at least 10 characters.",
            ],
            maxlength: [
                2000,
                "Description cannot exceed 2000 characters.",
            ],
        },

        price: {
            type: Number,
            required: [true, "Price is required."],
            min: [0, "Price cannot be negative."],
            max: [
                10000000,
                "Price cannot exceed ₹1 crore.",
            ],
        },

        location: {
            type: String,
            required: [true, "Location is required."],
            trim: true,
            minlength: [
                2,
                "Location must be at least 2 characters.",
            ],
            maxlength: [
                100,
                "Location cannot exceed 100 characters.",
            ],
        },

        country: {
            type: String,
            required: [true, "Country is required."],
            trim: true,
            minlength: [
                2,
                "Country must be at least 2 characters.",
            ],
            maxlength: [
                60,
                "Country cannot exceed 60 characters.",
            ],
        },


        // ============================
        // LISTING IMAGE
        // ============================

        image: {
            url: {
                type: String,
                default:
                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            },

            filename: {
                type: String,
                default: "default_image",
            },
        },


        // ============================
        // OWNER
        // ============================

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },


        // ============================
        // REVIEWS
        // ============================

        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
    },

    {
        timestamps: true,
    }
);


// ==========================================
// INDEXES
// ==========================================

// Search performance improve karne ke liye
listingSchema.index({
    title: "text",
    location: "text",
    country: "text",
});


// ==========================================
// EXPORT MODEL
// ==========================================

const Listing = mongoose.model(
    "Listing",
    listingSchema
);

module.exports = Listing;