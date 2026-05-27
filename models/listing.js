const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");

const listingSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        image: {
            url: {
                type: String,
                default: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
            },
            filename: {
                type: String,
                default: "default_image",
            },
        },
        price: {
            type: Number,
            min: [0, "Price cannot be negative"],
        },
        location: {
            type: String,
            trim: true,
        },
        country: {
            type: String,
            trim: true,
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: "Review",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

listingSchema.index({ location: 1, country: 1 });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;