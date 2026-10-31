# Triton Backend (Node.js + TypeScript + Express + PostgreSQL + Cloudflare R2)

RESTful API designed to manage Triton World Series event data, authenticate administrative users, and handle automated media optimization and uploads directly to Cloudflare R2 storage.

---

## ⚙️ Environment Configuration

In the `backend/` directory, create or edit your `.env` file based on [`.env.example`](./.env.example):

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=*

# PostgreSQL Connection String
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/triton_db?schema=public"

# JWT Authentication
JWT_SECRET="your_jwt_secret_key_here"

# Cloudflare R2 Object Storage
CLOUDFLARE_ACCOUNT_ID="your_cloudflare_account_id"
CLOUDFLARE_API_TOKEN="your_cloudflare_api_token"
R2_ACCESS_KEY_ID="your_r2_access_key_id"
R2_SECRET_ACCESS_KEY="your_r2_secret_access_key"
R2_BUCKET_NAME="triton-media"
R2_PUBLIC_URL="https://pub-xxxxxx.r2.dev"
```

---

## 🚀 Getting Started

### 1. Start Local PostgreSQL with Docker
```bash
cd backend
docker compose up -d
```
> Starts PostgreSQL 16 on port `5432` with database `triton_db` and user/password `postgres:postgres`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database Schema & Seed Data
```bash
npm run db:init
```
> Executes `database/schema.sql` (creates tables, relations, enums, indexes, and initial admin user `admin@triton.com`) and seeds default events.

### 4. Run Development Server
```bash
npm run dev
```
The server will start at: `http://localhost:3001`

### 5. Build & Run for Production
```bash
npm run build
npm start
```

---

## 📡 API Endpoints

Base URL: `http://localhost:3001/api`

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate admin user with email and password | No |
| `GET` | `/api/auth/me` | Retrieve profile of the currently authenticated user | Yes (`Bearer <token>`) |

### 2. Events (`/api/events`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/events` | List all events (supports query filters) | No |
| `GET` | `/api/events/:idOrSlug` | Get complete event details (formats, schedule, resort, POIs) | No |
| `POST` | `/api/events` | Create a new event | Yes (`Bearer <token>`) |
| `PUT` | `/api/events/:idOrSlug` | Update an existing event | Yes (`Bearer <token>`) |
| `DELETE` | `/api/events/:idOrSlug` | Delete an event (cascades to related records) | Yes (`Bearer <token>`) |

#### Supported Query Filters (`GET /api/events`):
- `eventFormat`: `triton1` or `triton3`
- `year`: e.g. `2026`, `2027`
- `status`: `Confirmed`, `Planned`, or `Completed`
- `language`: `pt-BR` or `en`
- `search`: Case-insensitive text search across title, location, country, and slug

*Example:*
```http
GET /api/events?eventFormat=triton3&year=2026
```

---

### 3. Media Upload (`/api/upload`)

Integrates with **Cloudflare R2** using `@aws-sdk/client-s3`. Uploaded images are automatically resized (max width 2560px) and converted to optimized **WebP** via `sharp`. PDFs (such as athlete Race Guides) are stored in their original format.

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload` | Upload a **single file** (`multipart/form-data`, field: `file`) | Yes (`Bearer <token>`) |
| `POST` | `/api/upload/multiple` | Upload **multiple files** (field: `files`, up to 10 files) | Yes (`Bearer <token>`) |

#### Frontend Upload Example:
```typescript
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("folder", "events/salvador-2026"); // optional folder path

const response = await fetch("http://localhost:3001/api/upload", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const { data } = await response.json();
console.log(data.url); 
// Returns public CDN URL: "https://pub-xxx.r2.dev/events/salvador-2026/1730335000-banner-a1b2c3.webp"
```

---

## 🗄️ Database Architecture

- **DDL Schema**: [`database/schema.sql`](./database/schema.sql)
- **Database Initializer**: [`src/database/init.ts`](./src/database/init.ts)
- **Native Connection Pool**: [`src/config/database.ts`](./src/config/database.ts)

### Core Tables:
- `users`: Administrative user credentials with Bcrypt password hashing.
- `events`: Core event records, metadata, hero imagery, and status flags.
- `athlete_areas`: 1:1 relation containing race results, tracking, and guide links.
- `event_formats`: 1:N disciplines (swim, bike, run) with distance tables and Strava segments.
- `schedule_days` & `schedule_events`: Multi-day race itinerary with granular time slots.
- `resorts`: Official partner hotel information, benefits, and direct booking links.
- `points_of_interest` & `logistics_items`: Local tourism, airports, and transport access details.

---

## 📁 Directory Structure

```text
backend/
├── database/
│   └── schema.sql              # Complete PostgreSQL DDL schema & constraints
├── src/
│   ├── config/
│   │   ├── database.ts         # Native PostgreSQL (pg) connection pool
│   │   └── r2.ts               # Cloudflare R2 S3 client configuration
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication handlers
│   │   ├── event.controller.ts  # Event CRUD handlers
│   │   └── upload.controller.ts # Media upload handlers
│   ├── data/
│   │   └── initialEvents.ts    # Seed data based on eventData.ts
│   ├── database/
│   │   └── init.ts             # Schema runner and seeder (npm run db:init)
│   ├── middlewares/
│   │   ├── auth.middleware.ts  # JWT verification middleware
│   │   ├── errorHandler.ts     # Global Express error handler
│   │   └── upload.middleware.ts# Multer memory storage and MIME filtering
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── event.routes.ts
│   │   ├── upload.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── auth.service.ts     # Bcrypt & JWT business logic
│   │   ├── event.service.ts    # Direct SQL queries & relational aggregation
│   │   └── storage.service.ts  # Sharp image compression & R2 dispatch
│   ├── types/
│   │   └── event.types.ts      # Complete TypeScript interfaces
│   ├── app.ts                  # Express application & global middleware setup
│   └── server.ts               # Server entry point & connection testing
├── docker-compose.yml          # Local PostgreSQL 16 container definition
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```
