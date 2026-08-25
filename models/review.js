const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const reviewSchema = new Schema(
    {
        comment: {
            type: String,
            trim: true,
            required: [true, "Comment is required."],
            minlength: [2, "Comment must be at least 2 characters."],
            maxlength: [1000, "Comment cannot exceed 1000 characters."],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required."],
            min: [1, "Rating must be between 1 and 5."],
            max: [5, "Rating must be between 1 and 5."],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
