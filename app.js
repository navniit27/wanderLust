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
const crypto = require("crypto");
const morgan = require("morgan");

const ExpressError = require("./utils/expressError");
const User = require("./models/user");

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.ATLASDB_URL || process.env.MONGO_URL;
const SESSION_SECRET = process.env.SECRET;
const IS_TEST = process.env.NODE_ENV === "test";

if (!IS_TEST) {
    if (!MONGO_URL) {
        console.error("❌ Set ATLASDB_URL or MONGO_URL in .env");
        process.exit(1);
    }

    if (!SESSION_SECRET) {
        console.error("❌ SECRET is missing in .env");
        process.exit(1);
    }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

if (!IS_TEST && process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                "default-src": ["'self'"],
                "script-src": ["'self'", "https://cdn.jsdelivr.net"],
                "style-src": [
                    "'self'",
                    "https://cdn.jsdelivr.net",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.googleapis.com",
                ],
                "font-src": [
                    "'self'",
                    "https://cdnjs.cloudflare.com",
                    "https://fonts.gstatic.com",
                    "data:",
                ],
                "img-src": [
                    "'self'",
                    "data:",
                    "https://res.cloudinary.com",
                    "https://images.unsplash.com",
                ],
                "connect-src": ["'self'"],
                "frame-ancestors": ["'self'"],
                "object-src": ["'none'"],
                "base-uri": ["'self'"],
                "form-action": ["'self'"],
            },
        },
    })
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.json({ limit: "10kb" }));
app.use(methodOverride("_method"));

app.use(
    express.static(path.join(__dirname, "public"), {
        maxAge: process.env.NODE_ENV === "production" ? "7d" : 0,
    })
);

app.use(compression());

async function connectDB(uri = MONGO_URL) {
    await mongoose.connect(uri);
    if (!IS_TEST) {
        console.log("✅ Connected to MongoDB");
    }
}

const sessionConfig = {
    name: "wanderlust.sid",
    secret: SESSION_SECRET || "test-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    },
};

if (!IS_TEST && MONGO_URL) {
    const store = MongoStore.create({
        mongoUrl: MONGO_URL,
        touchAfter: 24 * 60 * 60,
    });

    store.on("error", (error) => {
        console.error("❌ Session store error:", error.message);
    });

    sessionConfig.store = store;
}

app.use(session(sessionConfig));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    res.locals.search = req.query.search || "";
    res.locals.pageTitle = res.locals.pageTitle || "WanderLust";
    res.locals.pageDescription =
        res.locals.pageDescription ||
        "Discover and share unique stays around the world with WanderLust.";
    res.locals.canonicalPath = req.originalUrl.split("?")[0];
    res.locals.APP_URL = process.env.APP_URL || "";
    next();
});

if (!IS_TEST) {
    app.use((req, res, next) => {
        if (!req.session.csrfToken) {
            req.session.csrfToken = crypto.randomBytes(32).toString("hex");
        }

        res.locals.csrfToken = req.session.csrfToken;

        if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
            return next();
        }

        const token =
            req.body?._csrf ||
            req.query?._csrf ||
            req.get("x-csrf-token");

        const expected = req.session.csrfToken;

        if (
            !token ||
            typeof token !== "string" ||
            token.length !== expected.length ||
            !crypto.timingSafeEqual(
                Buffer.from(token),
                Buffer.from(expected)
            )
        ) {
            return next(
                new ExpressError(
                    403,
                    "Invalid or missing security token. Please retry the form."
                )
            );
        }

        return next();
    });
} else {
    app.use((req, res, next) => {
        res.locals.csrfToken = "test-csrf-token";
        next();
    });
}

const listingRouter = require("./routes/listings");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
    });
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

app.get("/privacy", (req, res) =>
    res.render("legal.ejs", { title: "Privacy", pageTitle: "Privacy · WanderLust" })
);
app.get("/terms", (req, res) =>
    res.render("legal.ejs", { title: "Terms", pageTitle: "Terms · WanderLust" })
);

app.get("/", (req, res) => {
    res.redirect("/listings");
});

app.use((req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
    if (!IS_TEST) {
        console.error("❌ Error:", err);
    }

    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || 500;
    const message =
        statusCode >= 500 && process.env.NODE_ENV === "production"
            ? "Something went wrong. Please try again later."
            : err.message || "Something went wrong!";

    res.status(statusCode).render("error.ejs", {
        err: {
            statusCode,
            message,
        },
    });
});

async function startServer() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}

module.exports = { app, connectDB, startServer };

if (require.main === module) {
    startServer();
}
