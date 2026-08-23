const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

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



const User = mongoose.model("User", userSchema);

module.exports = User;
