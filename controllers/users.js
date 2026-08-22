const User = require("../models/user");


// ==========================================
// RENDER SIGNUP FORM
// ==========================================

module.exports.renderSignupForm = (req, res) => {
    res.render("listings/users/signup.ejs");
};


// ==========================================
// SIGNUP USER
// ==========================================

module.exports.signup = async (req, res, next) => {
    try {
        const {
            username,
            email,
            password,
        } = req.body;

        const newUser = new User({
            email,
            username,
        });

        const registeredUser =
            await User.register(
                newUser,
                password
            );

        req.login(
            registeredUser,
            (err) => {
                if (err) {
                    return next(err);
                }

                req.flash(
                    "success",
                    "Welcome to WanderLust!"
                );

                res.redirect(
                    "/listings"
                );
            }
        );

    } catch (error) {

        req.flash(
            "error",
            error.message
        );

        res.redirect(
            "/signup"
        );
    }
};


// ==========================================
// RENDER LOGIN FORM
// ==========================================

module.exports.renderLoginForm = (
    req,
    res
) => {

    res.render(
        "listings/users/login.ejs"
    );
};


// ==========================================
// LOGIN USER
// ==========================================

module.exports.login = (
    req,
    res
) => {

    req.flash(
        "success",
        "Welcome back to WanderLust!"
    );

    const redirectUrl =
        res.locals.returnTo ||
        "/listings";

    res.redirect(
        redirectUrl
    );
};


// ==========================================
// LOGOUT USER
// ==========================================

module.exports.logout = (
    req,
    res,
    next
) => {

    req.logout(
        (err) => {

            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                "You have been logged out."
            );

            res.redirect(
                "/listings"
            );
        }
    );
};