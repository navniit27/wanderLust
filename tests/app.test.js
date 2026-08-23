process.env.NODE_ENV = "test";
process.env.SECRET = "test-secret-value-for-jest";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");

let mongo;
let app;
let connectDB;
let User;
let Listing;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGO_URL = mongo.getUri();
    process.env.ATLASDB_URL = "";

    ({ app, connectDB } = require("../app"));
    User = require("../models/user");
    Listing = require("../models/listing");

    await connectDB(process.env.MONGO_URL);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) {
        await mongo.stop();
    }
});

afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
});

async function registerUser({
    username = "traveler",
    email = "traveler@example.com",
    password = "password123",
    role = "user",
    emailVerified = true,
} = {}) {
    const user = new User({ email, username, role, emailVerified });
    await User.register(user, password);
    return user;
}

describe("WanderLust API", () => {
    test("GET /health returns ok", async () => {
        const res = await request(app).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });

    test("GET /listings renders", async () => {
        const res = await request(app).get("/listings");
        expect(res.status).toBe(200);
        expect(res.text).toContain("WanderLust");
    });

    test("GET unknown route returns 404 page", async () => {
        const res = await request(app).get("/no-such-page");
        expect(res.status).toBe(404);
        expect(res.text).toMatch(/not found/i);
    });

    test("POST /listings unauthenticated redirects to login", async () => {
        const res = await request(app)
            .post("/listings")
            .type("form")
            .send({
                "listing[title]": "Cozy Cabin",
                "listing[description]": "A lovely place to stay near the hills",
                "listing[price]": 1200,
                "listing[location]": "Manali",
                "listing[country]": "India",
            });

        expect(res.status).toBe(302);
        expect(res.headers.location).toBe("/login");
    });

    test("signup + login works", async () => {
        const agent = request.agent(app);

        const signup = await agent.post("/signup").type("form").send({
            username: "navneet",
            email: "navneet@example.com",
            password: "password123",
            confirmPassword: "password123",
        });

        expect(signup.status).toBe(302);
        expect(signup.headers.location).toBe("/listings");

        await agent.post("/logout");

        const login = await agent.post("/login").type("form").send({
            username: "navneet",
            password: "password123",
        });

        expect(login.status).toBe(302);
        expect(login.headers.location).toBe("/listings");
    });

    test("owner can create listing without image", async () => {
        const agent = request.agent(app);
        await registerUser({ username: "host1", email: "host1@example.com" });

        await agent.post("/login").type("form").send({
            username: "host1",
            password: "password123",
        });

        const create = await agent.post("/listings").type("form").send({
            "listing[title]": "Beach House",
            "listing[description]": "Beautiful beachside stay for families",
            "listing[price]": 2500,
            "listing[location]": "Goa",
            "listing[country]": "India",
        });

        expect(create.status).toBe(302);
        expect(create.headers.location).toMatch(/^\/listings\//);

        const listing = await Listing.findOne({ title: "Beach House" });
        expect(listing).toBeTruthy();
        expect(listing.location).toBe("Goa");
    });

    test("non-owner cannot delete listing", async () => {
        const owner = await registerUser({
            username: "owner1",
            email: "owner1@example.com",
        });
        await registerUser({
            username: "intruder",
            email: "intruder@example.com",
        });

        const listing = await Listing.create({
            title: "Mountain Hut",
            description: "Quiet mountain hut with great views",
            price: 1800,
            location: "Shimla",
            country: "India",
            owner: owner._id,
        });

        const agent = request.agent(app);
        await agent.post("/login").type("form").send({
            username: "intruder",
            password: "password123",
        });

        const del = await agent.delete(`/listings/${listing._id}`);
        expect(del.status).toBe(302);
        expect(del.headers.location).toBe(`/listings/${listing._id}`);

        const stillThere = await Listing.findById(listing._id);
        expect(stillThere).toBeTruthy();
    });

    test("review create and one-per-user rule", async () => {
        const owner = await registerUser({
            username: "owner2",
            email: "owner2@example.com",
        });
        await registerUser({
            username: "guest1",
            email: "guest1@example.com",
        });

        const listing = await Listing.create({
            title: "City Flat",
            description: "Modern flat in the heart of the city",
            price: 2200,
            location: "Pune",
            country: "India",
            owner: owner._id,
        });

        const agent = request.agent(app);
        await agent.post("/login").type("form").send({
            username: "guest1",
            password: "password123",
        });

        const first = await agent
            .post(`/listings/${listing._id}/reviews`)
            .type("form")
            .send({
                "review[rating]": 5,
                "review[comment]": "Amazing stay, loved it!",
            });

        expect(first.status).toBe(302);

        const second = await agent
            .post(`/listings/${listing._id}/reviews`)
            .type("form")
            .send({
                "review[rating]": 4,
                "review[comment]": "Trying again should fail",
            });

        expect(second.status).toBe(302);

        const Review = require("../models/review");
        const count = await Review.countDocuments({
            listing: listing._id,
            author: (await User.findOne({ username: "guest1" }))._id,
        });
        expect(count).toBe(1);
    });
});
