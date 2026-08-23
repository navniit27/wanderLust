const crypto = require("crypto");
const User = require("../models/user");
const { sendMail } = require("../utils/mail");

module.exports.renderSignupForm = (req, res) => {
    res.render("listings/users/signup.ejs");
};

function isSafeRedirect(url) {
    return (
        typeof url === "string" &&
        url.startsWith("/") &&
        !url.startsWith("//") &&
        !url.includes("://")
    );
}

function appBaseUrl(req) {
    return process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
}

module.exports.signup = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const newUser = new User({
            email: email.trim().toLowerCase(),
            username: username.trim(),
            emailVerified:
                process.env.NODE_ENV !== "production" &&
                process.env.FORCE_EMAIL_VERIFY !== "true",
        });

        const verifyToken = newUser.createEmailVerifyToken();
        const registeredUser = await User.register(newUser, password);

        if (!registeredUser.emailVerified) {
            const verifyUrl = `${appBaseUrl(req)}/verify-email/${verifyToken}`;
            await sendMail({
                to: registeredUser.email,
                subject: "Verify your WanderLust email",
                text: `Welcome to WanderLust!\n\nVerify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
            });
        }

        req.login(registeredUser, (err) => {
            if (err) {
                return next(err);
            }

            req.flash(
                "success",
                registeredUser.emailVerified
                    ? "Welcome to WanderLust!"
                    : "Welcome to WanderLust! Please check your email to verify your account."
            );
            res.redirect("/listings");
        });
    } catch (error) {
        req.flash("error", error.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("listings/users/login.ejs");
};

module.exports.login = (req, res) => {
    if (req.body.remember === "on" || req.body.remember === "true") {
        req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    } else {
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000;
    }

    req.flash("success", "Welcome back to WanderLust!");

    const redirectUrl = res.locals.returnTo;
    delete req.session.returnTo;

    if (isSafeRedirect(redirectUrl)) {
        return res.redirect(redirectUrl);
    }

    res.redirect("/listings");
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }

        req.flash("success", "You have been logged out.");
        res.redirect("/listings");
    });
};

module.exports.verifyEmail = async (req, res) => {
    const hashed = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        emailVerifyToken: hashed,
        emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash("error", "Email verification link is invalid or has expired.");
        return res.redirect("/login");
    }

    user.emailVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save();

    req.flash("success", "Email verified successfully. You're all set!");
    res.redirect("/listings");
};

module.exports.resendVerification = async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }

    if (req.user.emailVerified) {
        req.flash("success", "Your email is already verified.");
        return res.redirect("/listings");
    }

    const token = req.user.createEmailVerifyToken();
    await req.user.save();

    const verifyUrl = `${appBaseUrl(req)}/verify-email/${token}`;
    await sendMail({
        to: req.user.email,
        subject: "Verify your WanderLust email",
        text: `Verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    });

    req.flash("success", "Verification email sent. Check your inbox.");
    res.redirect("/listings");
};

module.exports.renderForgotForm = (req, res) => {
    res.render("listings/users/forgot.ejs");
};

module.exports.forgotPassword = async (req, res) => {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email });

    // Always show the same message to avoid email enumeration
    const genericMsg =
        "If an account exists for that email, a reset link has been sent.";

    if (!user) {
        req.flash("success", genericMsg);
        return res.redirect("/forgot-password");
    }

    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${appBaseUrl(req)}/reset-password/${token}`;
    try {
        await sendMail({
            to: user.email,
            subject: "Reset your WanderLust password",
            text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, ignore this email.`,
        });
    } catch (_err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateBeforeSave: false });
        req.flash("error", "Could not send reset email. Try again later.");
        return res.redirect("/forgot-password");
    }

    req.flash("success", genericMsg);
    res.redirect("/login");
};

module.exports.renderResetForm = async (req, res) => {
    const hashed = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash("error", "Password reset link is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    res.render("listings/users/reset.ejs", { token: req.params.token });
};

module.exports.resetPassword = async (req, res) => {
    const hashed = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashed,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        req.flash("error", "Password reset link is invalid or has expired.");
        return res.redirect("/forgot-password");
    }

    await user.setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    req.flash("success", "Password updated. You can log in now.");
    res.redirect("/login");
};
