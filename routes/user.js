const express = require("express");
const router = express.Router();

const passport = require("passport");

const userController = require("../controllers/users");

const {
    saveReturnTo,
    wrapAsync,
} = require("../middleware");


// ==========================================
// SIGNUP
// ==========================================

router
    .route("/signup")
    .get(userController.renderSignupForm)
    .post(
        wrapAsync(userController.signup)
    );


// ==========================================
// LOGIN
// ==========================================

router
    .route("/login")
    .get(userController.renderLoginForm)
    .post(
        saveReturnTo,
        passport.authenticate("local", {
            failureRedirect: "/login",
            failureFlash: true,
        }),
        userController.login
    );


// ==========================================
// LOGOUT
// ==========================================

router.post(
    "/logout",
    userController.logout
);


module.exports = router;