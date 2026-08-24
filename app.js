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

const ExpressError = require("./utils/expressError");

const User = require("./models/user");



const PORT = process.env.PORT || 8080;

const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGO_URL;

const SESSION_SECRET = process.env.SECRET;



if (!MONGO_URL) {
    console.error("❌ Set ATLASDB_URL or MONGO_URL in .env");
    process.exit(1);
}

if (!SESSION_SECRET) {
    console.error("❌ SECRET is missing in .env");
    process.exit(1);
}



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



if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}



app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "img-src": [
                    "'self'",
                    "data:",
                    "https://res.cloudinary.com",
                    "https://images.unsplash.com"
                ],
                "style-src": [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com"
                ],
                "style-src-attr": ["'unsafe-inline'"],
                "script-src": [
                    "'self'",
                    "https://cdn.jsdelivr.net"
                ],
                "font-src": [
                    "'self'",
                    "https://fonts.gstatic.com",
                    "https://cdnjs.cloudflare.com",
                    "data:"
                ],
                "connect-src": ["'self'"],
                "object-src": ["'none'"],
                "base-uri": ["'self'"],
                "frame-ancestors": ["'none'"]
            }
        }
    })
);



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



app.use(
    methodOverride("_method")
);



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



app.use(
    compression()
);



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



app.use(
    flash()
);



app.use(
    passport.initialize()
);

app.use(
    passport.session()
);



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



const { csrfToken } = require("./middleware");

app.use(csrfToken);



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

const listingRouter =
    require("./routes/listings");

const reviewRouter =
    require("./routes/review");

const userRouter =
    require("./routes/user");

app.use("/listings", (req, res, next) => {
    console.log("🔥 /listings ROUTER REACHED:", req.method, req.originalUrl);
    next();
});

app.use(
    "/listings",
    listingRouter
);

app.use(
    "/listings/:id/reviews",
    reviewRouter
);



app.use(
    "/",
    userRouter
);



app.get(
    "/",
    (req, res) => {

        res.redirect(
            "/listings"
        );
    }
);



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


        const isProduction =
            process.env.NODE_ENV === "production";

        const message =
            statusCode >= 500 && isProduction
                ? "Something went wrong. Please try again later."
                : err.message || "Something went wrong!";


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
