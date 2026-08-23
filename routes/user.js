const express = require("express");
const router = express.Router();

const passport = require("passport");

const userController = require("../controllers/users");

const {
    saveReturnTo,
    csrfProtection,
} = require("../middleware");

const wrapAsync = require("../utils/wrapAsync");



router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(
        csrfProtection,
        wrapAsync(userController.signup)
    );



router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        csrfProtection,
        saveReturnTo,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );



router.post(
    "/logout",
    csrfProtection,
    userController.logout
);


module.exports = router;
