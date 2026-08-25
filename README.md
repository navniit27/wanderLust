# WanderLust

An Airbnb-inspired full-stack listing platform for discovering, creating, and reviewing places to stay.

[![CI](https://github.com/navniit27/wanderLust/actions/workflows/ci.yml/badge.svg)](https://github.com/navniit27/wanderLust/actions/workflows/ci.yml)

## Features

- Local authentication with signup, login, and logout
- Listing CRUD with owner-only edit and delete actions
- Cloudinary image uploads with JPG, PNG, and WebP validation (5 MB limit)
- Authenticated reviews with author-only deletion
- Search across listing title, location, and country
- Server-side Joi validation, CSRF protection, Helmet security headers, secure sessions, and Mongo-backed session storage
- Docker Compose setup with an isolated local MongoDB service

## Stack

- Node.js 20, Express 4, EJS, Bootstrap 5
- MongoDB and Mongoose
- Passport Local and passport-local-mongoose
- Cloudinary, Multer, Joi, Helmet, connect-mongo
- Docker and GitHub Actions

## Run locally

Requirements: Node.js 20+, npm, a MongoDB instance (Atlas or local), and Cloudinary credentials if image uploads are needed.

```bash
git clone https://github.com/navniit27/wanderLust.git
cd wanderLust
npm ci
cp .env.example .env
npm run dev
```

Open [http://localhost:8080/listings](http://localhost:8080/listings).

Set either `ATLASDB_URL` or `MONGO_URL` in `.env`. `ATLASDB_URL` takes precedence when both values are present.

## Environment variables

Copy `.env.example` to `.env`; never commit the real `.env` file.

```dotenv
NODE_ENV=development
PORT=8080
ATLASDB_URL=mongodb+srv://username:password@cluster.mongodb.net/wanderlust
SECRET=replace-with-a-long-random-session-secret
SEED_OWNER_ID=optional-user-object-id-for-the-seed-script
SEED_RESET=false
CLOUD_NAME=your-cloudinary-cloud-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
```

For a standalone local MongoDB server, replace `ATLASDB_URL` with:

```dotenv
MONGO_URL=mongodb://127.0.0.1:27017/wanderlust
```

## Seed data

The seed script is intentionally non-destructive by default. It never clears the entire database.

Set `SEED_OWNER_ID` to an existing User ObjectId, then run:

```bash
npm run seed
```

To replace only that user's existing seed listings, set `SEED_RESET=true` before running the command. Do not use the seed script against a production database unless you understand the effect of `SEED_RESET`.

## Docker

Docker Compose starts the application and an internal MongoDB container. It deliberately binds only the application port to localhost; MongoDB is not exposed to the host.

```bash
cp .env.example .env
# Set SECRET and (optionally) Cloudinary credentials in .env
docker compose up --build
```

Visit [http://localhost:8080/listings](http://localhost:8080/listings). Compose forces the app to use its `mongo` service even if your `.env` contains an Atlas URL.

Useful commands:

```bash
docker compose up -d
docker compose logs -f app
docker compose down
docker compose down -v # also removes the local MongoDB volume
```

## CI/CD

The GitHub Actions workflow runs on pull requests and pushes to `main`, `master`, and `optimize`:

1. Installs dependencies with `npm ci`.
2. Checks syntax for every project JavaScript file outside `node_modules`.
3. Runs a high-severity `npm audit` check and reports findings without blocking the pipeline.
4. Builds and inspects the production Docker image.

On pushes to `main`, a final job triggers a Render deployment only when the repository secret `RENDER_DEPLOY_HOOK_URL` is configured. Pushes to `master` and `optimize` do not deploy to Render.

## Routes

- `GET /listings` — browse and search listings
- `GET /listings/new`, `POST /listings` — create a listing (authenticated)
- `GET /listings/:id`, `GET /listings/:id/edit`, `PUT /listings/:id`, `DELETE /listings/:id` — listing detail and CRUD
- `POST /listings/:id/reviews`, `DELETE /listings/:id/reviews/:reviewId` — review actions
- `GET|POST /signup`, `GET|POST /login`, `POST /logout` — authentication

## Project layout

```text
controllers/  Request handlers
models/       Mongoose schemas and indexes
routes/       Express routes
views/        EJS pages and shared components
public/       CSS and client-side JavaScript
middleware.js Authentication, authorization, CSRF, and validation
schema.js     Joi request schemas
```

## Author

Navneet — [@navniit27](https://github.com/navniit27)
