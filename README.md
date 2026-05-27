<div align="center">

# 🌍 WanderLust

> An Airbnb-inspired full-stack web application to discover and share extraordinary places to stay.

![CI/CD Pipeline](https://github.com/navniit27/wanderLust/actions/workflows/ci.yml/badge.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker)
![Render](https://img.shields.io/badge/Deployed-Render-46E3B7?logo=render)

</div>

---

## 🔗 Live Demo

👉 **[https://wanderlust-5yc4.onrender.com](https://wanderlust-5yc4.onrender.com)**

---

## 📸 Features

- 🔐 **User Authentication** — Secure Signup, Login & Logout using Passport.js
- 🏡 **Listings** — Create, Read, Update and Delete property listings
- 📸 **Image Upload** — Cloud image storage via Cloudinary + Multer
- ⭐ **Reviews System** — Rate and review listings (1 to 5 stars)
- 🛡️ **Authorization** — Only owners can edit or delete their own listings and reviews
- 🐳 **Docker Support** — Multi-stage Docker build + Docker Compose for easy setup
- ⚡ **CI/CD Pipeline** — Automated testing and deployment via GitHub Actions
- 🔒 **Security** — Helmet.js headers, Mongo sanitization, secure & httpOnly cookies

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB, Mongoose |
| **Authentication** | Passport.js, passport-local-mongoose |
| **Image Upload** | Cloudinary, Multer |
| **Frontend** | EJS, EJS-Mate, Bootstrap 5 |
| **Validation** | Joi |
| **Security** | Helmet.js, express-mongo-sanitize |
| **Session** | express-session, connect-mongo |
| **DevOps** | Docker, GitHub Actions, Render |

---

## 🗂️ Project Structure

```
wanderLust/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI/CD pipeline
├── controllers/             # Business logic — separated from routes
│   ├── listings.js          # Listing CRUD logic
│   ├── reviews.js           # Review create & delete logic
│   └── users.js             # Signup, login, logout logic
├── models/                  # Mongoose schemas
│   ├── listing.js           # Listing model with indexes
│   ├── review.js            # Review model
│   └── user.js              # User model with passport plugin
├── routes/                  # Express route definitions
│   ├── listings.js          # /listings routes
│   ├── review.js            # /listings/:id/reviews routes
│   └── user.js              # /signup /login /logout routes
├── views/                   # EJS templates
│   ├── listings/            # index, show, new, edit pages
│   └── includes/            # navbar, footer, flash partials
├── public/                  # Static assets (CSS, JS)
├── utils/                   # Helper utilities
│   ├── expressError.js      # Custom error class
│   └── wrapAsync.js         # Async error wrapper
├── middleware.js             # isLoggedIn, isOwner, validate middlewares
├── schema.js                 # Joi validation schemas
├── cloudConfig.js            # Cloudinary configuration
├── app.js                    # Application entry point
├── Dockerfile                # Multi-stage Docker build
├── docker-compose.yml        # Local development setup
└── .env.example              # Environment variables template
```

---

## 🚀 Local Setup

### Prerequisites

- Node.js v20+
- MongoDB (local or Atlas)
- Cloudinary account (free tier works)

### Steps

```bash
# 1. Repository clone karo
git clone https://github.com/navniit27/wanderLust.git
cd wanderLust

# 2. Dependencies install karo
npm install --legacy-peer-deps

# 3. Environment variables set karo
cp .env.example .env
# Ab .env file kholo aur apni values bharo

# 4. Development server start karo
npm run dev

# Ya production mode mein
npm start
```

Open your browser: [http://localhost:8080](http://localhost:8080)

---

## 🐳 Docker se Run Karo

```bash
# Build karke start karo (pehli baar)
docker compose up --build

# Background mein chalao
docker compose up -d

# Logs dekho
docker compose logs -f

# Band karo
docker compose down
```

---

## 🔁 CI/CD Pipeline

Har `master` branch push pe GitHub Actions automatically yeh karta hai:

```
Push to master
      │
      ▼
┌──────────────────────┐
│  🔍 Lint & Validate  │  ← Saari JS files syntax check + npm audit
└──────────┬───────────┘
           │ pass hone pe
           ▼
┌──────────────────────┐
│  🐳 Docker Build     │  ← Docker image build test hoti hai CI mein
└──────────┬───────────┘
           │ pass hone pe
           ▼
┌──────────────────────┐
│  🚀 Deploy to Render │  ← Auto deploy, response code bhi verify hota hai
└──────────────────────┘
```

> **Note:** Pull Request pe sirf Lint + Docker Build hota hai — Deploy nahi hota.

---

## 🔐 Environment Variables

`.env.example` file copy karke `.env` banao aur yeh values bharo:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` ya `production` |
| `PORT` | Server port (default: 8080) |
| `SECRET` | Session secret key |
| `ATLASDB_URL` | MongoDB Atlas connection string |
| `CLOUD_NAME` | Cloudinary cloud name |
| `CLOUD_API_KEY` | Cloudinary API key |
| `CLOUD_API_SECRET` | Cloudinary API secret |

---

## 📡 API Routes

### Listings

| Method | Route | Description |
|---|---|---|
| GET | `/listings` | Saari listings dekho |
| POST | `/listings` | Nayi listing banao |
| GET | `/listings/new` | New listing form |
| GET | `/listings/:id` | Ek listing dekho |
| PUT | `/listings/:id` | Listing update karo |
| DELETE | `/listings/:id` | Listing delete karo |
| GET | `/listings/:id/edit` | Edit form |

### Reviews

| Method | Route | Description |
|---|---|---|
| POST | `/listings/:id/reviews` | Review add karo |
| DELETE | `/listings/:id/reviews/:reviewId` | Review delete karo |

### Users

| Method | Route | Description |
|---|---|---|
| GET/POST | `/signup` | Register |
| GET/POST | `/login` | Login |
| GET | `/logout` | Logout |

---

## 👤 Author

**Navneet** — [@navniit27](https://github.com/navniit27)

---

<div align="center">
Made with ❤️ using Node.js · Express · MongoDB · Docker
</div>