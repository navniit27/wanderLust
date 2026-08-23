const express = require("express");
const router = express.Router();

const passport = require("passport");

const userController = require("../controllers/users");
const { authLimiter } = require("../utils/rateLimiters");

const {
    saveReturnTo,
    wrapAsync,
    validateSignup,
    validateForgotPassword,
    validateResetPassword,
    isLoggedIn,
} = require("../middleware");

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(authLimiter, validateSignup, wrapAsync(userController.signup));

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        authLimiter,
        saveReturnTo,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );

router.post("/logout", userController.logout);

router.get(
    "/verify-email/:token",
    wrapAsync(userController.verifyEmail)
);

router.post(
    "/resend-verification",
    isLoggedIn,
    authLimiter,
    wrapAsync(userController.resendVerification)
);

router
    .route("/forgot-password")
    .get(userController.renderForgotForm)
    .post(
        authLimiter,
        validateForgotPassword,
        wrapAsync(userController.forgotPassword)
    );

router
    .route("/reset-password/:token")
    .get(wrapAsync(userController.renderResetForm))
    .post(
        authLimiter,
        validateResetPassword,
        wrapAsync(userController.resetPassword)
    );

module.exports = router;
