const User = require("../models/user.js");

module.exports.renderSignupForm = (req, res) => {
    res.render("listings/users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log(`Signup blocked: Email already exists - ${email}`);

            req.flash(
                "error",
                "An account with this email already exists. Please log in."
            );

            return res.redirect("/signup");
        }

        const newUser = new User({
            email,
            username
        });

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) {
                console.error("Signup login error:", err);
                return next(err);
            }

            req.flash("success", "Welcome to WanderLust!");
            res.redirect("/listings");
        });

    } catch (err) {
        console.error("Signup Error:", err);

        req.flash(
            "error",
            "Something went wrong while creating your account. Please try again."
        );

        return res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req,res)=>{
    res.render("listings/users/login.ejs");
};

module.exports.login = (req, res) => {
    req.flash("success", "Welcome back to WanderLust!");
    const redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    });
};