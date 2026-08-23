const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const crypto = require("crypto");

const { Schema } = mongoose;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerifyToken: String,
        emailVerifyExpires: Date,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
    },
    {
        timestamps: true,
    }
);

const passportPlugin =
    typeof passportLocalMongoose === "function"
        ? passportLocalMongoose
        : passportLocalMongoose.default;

userSchema.plugin(passportPlugin);

userSchema.methods.createEmailVerifyToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.emailVerifyToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000;
    return token;
};

userSchema.methods.createPasswordResetToken = function () {
    const token = crypto.randomBytes(32).toString("hex");
    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
    this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    return token;
};

userSchema.methods.isAdmin = function () {
    return this.role === "admin";
};

const User = mongoose.model("User", userSchema);

module.exports = User;
