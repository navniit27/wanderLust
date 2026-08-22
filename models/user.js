const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const { Schema } = mongoose;


// ==========================================
// USER SCHEMA
// ==========================================

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required."],
            unique: true,
            lowercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);


// ==========================================
// PASSPORT LOCAL MONGOOSE
// ==========================================

// Some versions export the plugin directly,
// while others expose it through `.default`.

const passportPlugin =
    typeof passportLocalMongoose === "function"
        ? passportLocalMongoose
        : passportLocalMongoose.default;

userSchema.plugin(passportPlugin);


// ==========================================
// USER MODEL
// ==========================================

const User = mongoose.model("User", userSchema);

module.exports = User;