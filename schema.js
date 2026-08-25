const Joi = require("joi");
const listingSchema = Joi.object({

    listing: Joi.object({

        title: Joi.string()
            .trim()
            .min(3)
            .max(100)
            .required()
            .messages({
                "string.empty":
                    "Title is required.",
                "string.min":
                    "Title must be at least 3 characters.",
                "string.max":
                    "Title cannot exceed 100 characters.",
                "any.required":
                    "Title is required.",
            }),

        description: Joi.string()
            .trim()
            .min(10)
            .max(2000)
            .required()
            .messages({
                "string.empty":
                    "Description is required.",
                "string.min":
                    "Description must be at least 10 characters.",
                "string.max":
                    "Description cannot exceed 2000 characters.",
                "any.required":
                    "Description is required.",
            }),

        price: Joi.number()
            .integer()
            .min(0)
            .max(10000000)
            .required()
            .messages({
                "number.base":
                    "Price must be a valid number.",
                "number.integer":
                    "Price must be a whole number.",
                "number.min":
                    "Price cannot be negative.",
                "number.max":
                    "Price cannot exceed ₹1 crore.",
                "any.required":
                    "Price is required.",
            }),

        location: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .required()
            .messages({
                "string.empty":
                    "Location is required.",
                "string.min":
                    "Location must be at least 2 characters.",
                "string.max":
                    "Location cannot exceed 100 characters.",
                "any.required":
                    "Location is required.",
            }),

        country: Joi.string()
            .trim()
            .min(2)
            .max(60)
            .required()
            .messages({
                "string.empty":
                    "Country is required.",
                "string.min":
                    "Country must be at least 2 characters.",
                "string.max":
                    "Country cannot exceed 60 characters.",
                "any.required":
                    "Country is required.",
            }),

    }).required(),

});

const reviewSchema = Joi.object({

    review: Joi.object({

        rating: Joi.number()
            .integer()
            .min(1)
            .max(5)
            .required()
            .messages({
                "number.base":
                    "Rating must be a number.",
                "number.integer":
                    "Rating must be a whole number.",
                "number.min":
                    "Rating must be between 1 and 5.",
                "number.max":
                    "Rating must be between 1 and 5.",
                "any.required":
                    "Rating is required.",
            }),

        comment: Joi.string()
            .trim()
            .min(2)
            .max(1000)
            .required()
            .messages({
                "string.empty":
                    "Comment is required.",
                "string.min":
                    "Comment must be at least 2 characters.",
                "string.max":
                    "Comment cannot exceed 1000 characters.",
                "any.required":
                    "Comment is required.",
            }),

    }).required(),

});

module.exports = {
    listingSchema,
    reviewSchema,
};
