const User = require("../models/user");


// ==========================================
// RENDER SIGNUP FORM
// ==========================================

module.exports.renderSignupForm = (req, res) => {
    res.render("users/signup.ejs");
};


// ==========================================
// SIGNUP
// ==========================================

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        // Basic validation
        if (!username?.trim()) {
            req.flash("error", "Username is required.");
            return res.redirect("/signup");
        }

        if (!email?.trim()) {
            req.flash("error", "Email is required.");
            return res.redirect("/signup");
        }

        if (!password) {
            req.flash("error", "Password is required.");
            return res.redirect("/signup");
        }

        const normalizedEmail = email
            .trim()
            .toLowerCase();

        // Create user using passport-local-mongoose
        const newUser = new User({
            username: username.trim(),
            email: normalizedEmail,
        });

        const registeredUser = await User.register(
            newUser,
            password
        );

        // Automatically log user in after signup
        req.login(
            registeredUser,
            (loginError) => {
                if (loginError) {
                    return next(loginError);
                }

                req.flash(
                    "success",
                    "Welcome to WanderLust!"
                );

                const redirectUrl =
                    res.locals.returnTo || "/listings";

                res.redirect(redirectUrl);
            }
        );
    } catch (error) {
        // Duplicate username/email etc.
        if (
            error.code === 11000 ||
            error.name === "UserExistsError"
        ) {
            req.flash(
                "error",
                "Username or email is already registered."
            );

            return res.redirect("/signup");
        }

        next(error);
    }
};


// ==========================================
// RENDER LOGIN FORM
// ==========================================

module.exports.renderLoginForm = (req, res) => {
    res.render("users/login.ejs");
};


// ==========================================
// LOGIN
// ==========================================

module.exports.login = (req, res) => {
    req.flash(
        "success",
        "Welcome back to WanderLust!"
    );

    const redirectUrl =
        res.locals.returnTo || "/listings";

    res.redirect(redirectUrl);
};


// ==========================================
// LOGOUT
// ==========================================

module.exports.logout = (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        req.flash(
            "success",
            "You have been logged out."
        );

        res.redirect("/listings");
    });
};