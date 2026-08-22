require("dotenv").config();

const express = require("express");
const app = express();

const mongoose = require("mongoose");
const path = require("path");

const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const session = require("express-session");
const { MongoStore } = require("connect-mongo");

const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const helmet = require("helmet");
const compression = require("compression");

const ExpressError = require("./utils/ExpressError");

const User = require("./models/user");


// ==========================================
// ENVIRONMENT
// ==========================================

const PORT = process.env.PORT || 8080;

const MONGO_URL = process.env.ATLASDB_URL;

const SESSION_SECRET = process.env.SECRET;


// ==========================================
// REQUIRED ENVIRONMENT VARIABLES
// ==========================================

if (!MONGO_URL) {
    console.error("❌ ATLASDB_URL is missing in .env");
    process.exit(1);
}

if (!SESSION_SECRET) {
    console.error("❌ SECRET is missing in .env");
    process.exit(1);
}


// ==========================================
// EXPRESS CONFIGURATION
// ==========================================

app.set(
    "view engine",
    "ejs"
);

app.set(
    "views",
    path.join(__dirname, "views")
);

app.engine(
    "ejs",
    ejsMate
);


// ==========================================
// PRODUCTION PROXY
// ==========================================

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}


// ==========================================
// SECURITY HEADERS
// ==========================================

app.use(
    helmet()
);


// ==========================================
// REQUEST BODY PARSING
// ==========================================

app.use(
    express.urlencoded({
        extended: true,
        limit: "10kb",
    })
);

app.use(
    express.json({
        limit: "10kb",
    })
);


// ==========================================
// METHOD OVERRIDE
// ==========================================

app.use(
    methodOverride("_method")
);


// ==========================================
// STATIC FILES
// ==========================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        ),
        {
            maxAge:
                process.env.NODE_ENV === "production"
                    ? "7d"
                    : 0,
        }
    )
);


// ==========================================
// COMPRESSION
// ==========================================

app.use(
    compression()
);


// ==========================================
// DATABASE CONNECTION
// ==========================================

async function connectDB() {

    try {

        await mongoose.connect(
            MONGO_URL
        );

        console.log(
            "✅ Connected to MongoDB"
        );

    } catch (error) {

        console.error(
            "❌ MongoDB connection failed:",
            error.message
        );

        process.exit(1);
    }
}


// ==========================================
// SESSION STORE
// ==========================================

const store = MongoStore.create({
    mongoUrl: MONGO_URL,

    touchAfter:
        24 * 60 * 60,
});


store.on(
    "error",
    (error) => {

        console.error(
            "❌ Session store error:",
            error.message
        );

    }
);


// ==========================================
// SESSION
// ==========================================

app.use(
    session({

        store,

        secret:
            SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {

            maxAge:
                7 *
                24 *
                60 *
                60 *
                1000,

            httpOnly: true,

            sameSite: "lax",

            secure:
                process.env.NODE_ENV ===
                "production",
        },

    })
);


// ==========================================
// FLASH
// ==========================================

app.use(
    flash()
);


// ==========================================
// PASSPORT
// ==========================================

app.use(
    passport.initialize()
);

app.use(
    passport.session()
);


// ==========================================
// PASSPORT CONFIGURATION
// ==========================================

passport.use(
    new LocalStrategy(
        User.authenticate()
    )
);


passport.serializeUser(
    User.serializeUser()
);


passport.deserializeUser(
    User.deserializeUser()
);


// ==========================================
// GLOBAL LOCALS
// ==========================================

app.use(
    (req, res, next) => {

        res.locals.success =
            req.flash(
                "success"
            );

        res.locals.error =
            req.flash(
                "error"
            );

        res.locals.currUser =
            req.user;

        next();
    }
);


// ==========================================
// ROUTES
// ==========================================

const listingRouter =
    require("./routes/listings");

const reviewRouter =
    require("./routes/review");

const userRouter =
    require("./routes/user");


// ==========================================
// LISTINGS
// ==========================================

app.use(
    "/listings",
    listingRouter
);


// ==========================================
// REVIEWS
// ==========================================

app.use(
    "/listings/:id/reviews",
    reviewRouter
);


// ==========================================
// USERS
// ==========================================

app.use(
    "/",
    userRouter
);


// ==========================================
// HOME ROUTE
// ==========================================

app.get(
    "/",
    (req, res) => {

        res.redirect(
            "/listings"
        );

    }
);


// ==========================================
// 404 HANDLER
// ==========================================

app.use(
    (req, res, next) => {

        next(
            new ExpressError(
                404,
                "Page not found!"
            )
        );

    }
);


// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "❌ Error:",
            err
        );


        if (
            res.headersSent
        ) {
            return next(err);
        }


        const statusCode =
            err.statusCode ||
            500;


        const message =
            err.message ||
            "Something went wrong!";


        res.status(
            statusCode
        );


        res.render(
            "error.ejs",
            {
                err: {
                    statusCode,
                    message,
                },
            }
        );

    }
);


// ==========================================
// START APPLICATION
// ==========================================

async function startServer() {

    await connectDB();

    app.listen(
        PORT,
        () => {

            console.log(
                `🚀 Server is running on port ${PORT}`
            );

        }
    );
}


startServer();