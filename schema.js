const Joi = require("joi");

const listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().trim().min(3).max(100).required().messages({
            "string.empty": "Title is required.",
            "string.min": "Title must be at least 3 characters.",
            "string.max": "Title cannot exceed 100 characters.",
            "any.required": "Title is required.",
        }),
        description: Joi.string().trim().min(10).max(2000).required().messages({
            "string.empty": "Description is required.",
            "string.min": "Description must be at least 10 characters.",
            "string.max": "Description cannot exceed 2000 characters.",
            "any.required": "Description is required.",
        }),
        price: Joi.number().integer().min(0).max(10000000).required().messages({
            "number.base": "Price must be a valid number.",
            "number.integer": "Price must be a whole number.",
            "number.min": "Price cannot be negative.",
            "number.max": "Price cannot exceed ₹1 crore.",
            "any.required": "Price is required.",
        }),
        location: Joi.string().trim().min(2).max(100).required().messages({
            "string.empty": "Location is required.",
            "string.min": "Location must be at least 2 characters.",
            "string.max": "Location cannot exceed 100 characters.",
            "any.required": "Location is required.",
        }),
        country: Joi.string().trim().min(2).max(60).required().messages({
            "string.empty": "Country is required.",
            "string.min": "Country must be at least 2 characters.",
            "string.max": "Country cannot exceed 60 characters.",
            "any.required": "Country is required.",
        }),
    })
        .required()
        .unknown(false),
}).unknown(false);

const reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().integer().min(1).max(5).required().messages({
            "number.base": "Rating must be a number.",
            "number.integer": "Rating must be a whole number.",
            "number.min": "Rating must be between 1 and 5.",
            "number.max": "Rating must be between 1 and 5.",
            "any.required": "Rating is required.",
        }),
        comment: Joi.string().trim().min(2).max(1000).required().messages({
            "string.empty": "Comment is required.",
            "string.min": "Comment must be at least 2 characters.",
            "string.max": "Comment cannot exceed 1000 characters.",
            "any.required": "Comment is required.",
        }),
    })
        .required()
        .unknown(false),
}).unknown(false);

const signupSchema = Joi.object({
    username: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .required()
        .messages({
            "string.empty": "Username is required.",
            "string.min": "Username must be at least 3 characters.",
            "string.max": "Username cannot exceed 30 characters.",
            "string.pattern.base":
                "Username may only contain letters, numbers, and underscores.",
            "any.required": "Username is required.",
        }),
    email: Joi.string().trim().email().max(254).required().messages({
        "string.empty": "Email is required.",
        "string.email": "Please enter a valid email address.",
        "any.required": "Email is required.",
    }),
    password: Joi.string().min(8).max(128).required().messages({
        "string.empty": "Password is required.",
        "string.min": "Password must be at least 8 characters.",
        "string.max": "Password cannot exceed 128 characters.",
        "any.required": "Password is required.",
    }),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Passwords do not match.",
        "any.required": "Please confirm your password.",
    }),
}).unknown(false);

const forgotPasswordSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.email": "Please enter a valid email address.",
        "any.required": "Email is required.",
    }),
}).unknown(false);

const resetPasswordSchema = Joi.object({
    password: Joi.string().min(8).max(128).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Passwords do not match.",
    }),
}).unknown(false);

module.exports = {
    listingSchema,
    reviewSchema,
    signupSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
};
