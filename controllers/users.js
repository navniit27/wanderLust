const User = require("../models/user");



module.exports.renderSignupForm = (req, res) => {
    res.render("listings/users/signup.ejs");
};



module.exports.signup = async (req, res, next) => {
    try {
        const {
            username,
            email,
            password,
        } = req.body;

        if (typeof password !== "string" || password.length < 8) {
            req.flash(
                "error",
                "Password must be at least 8 characters."
            );
            return res.redirect("/signup");
        }

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
        let message = "Unable to create your account. Please check your details and try again.";

        if (error?.code === 11000) {
            const duplicateField = Object.keys(error.keyPattern || error.keyValue || {})[0];
            if (duplicateField === "email") message = "That email is already registered.";
            if (duplicateField === "username") message = "That username is already taken.";
        } else if (error?.name === "UserExistsError") {
            message = "That username is already taken.";
        }

        req.flash("error", message);
        res.redirect("/signup");
    }
};



module.exports.renderLoginForm = (
    req,
    res
) => {

    res.render(
        "listings/users/login.ejs"
    );
};



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

    delete req.session.returnTo;

    res.redirect(
        redirectUrl
    );
};



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
