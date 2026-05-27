const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],  
            unique: true,                            
            lowercase: true,                         
            trim: true,                              
        },
    },
    { timestamps: true }  
);

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);