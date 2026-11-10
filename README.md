# IncubaCloud — Enterprise Incubation Management Platform

A full-stack capstone project for managing startup incubation programs, founder records, venture stages, and execution milestones. Built as a practical demonstration of HTML5, CSS3, JavaScript, TypeScript, React, Next.js, Node.js, REST APIs, PostgreSQL, and Docker.

> **Project type:** Enterprise-style SaaS dashboard / incubation operations platform  
> **Architecture:** Next.js frontend + Express REST API + PostgreSQL database  
> **Status:** Working MVP scaffold with authentication, dashboard analytics, startup CRUD/status management, programs, milestones, and Docker Compose setup.

## Features

- Administrator registration and login using bcrypt password hashing and JWT sessions.
- Dashboard KPIs for startups, active ventures, programs, and completed milestones.
- Startup directory with search and status filtering.
- Create, update-status, and delete startup records.
- Incubation program directory with startup counts.
- Milestone tracking with due dates and completion state.
- PostgreSQL relational schema, foreign keys, indexes, and starter sample records.
- API security basics: Helmet headers, CORS allow-list, request rate limiting, input validation with Zod, parameterized SQL queries.
- Docker Compose orchestration for web, API, and database services.

## Technology stack

| Layer | Technologies |
|---|---|
| Structure and styling | HTML5, CSS3 |
| Language | JavaScript, TypeScript |
| Frontend | React 19, Next.js 15 |
| Backend | Node.js, Express, REST API |
| Database | PostgreSQL 16 |
| Validation / security | Zod, bcryptjs, JWT, Helmet, express-rate-limit |
| Deployment environment | Docker, Docker Compose |

## Architecture

```text
┌──────────────────────────────┐
│         User / Admin         │
└──────────────┬───────────────┘
               │ HTTPS / Browser
               ▼
┌──────────────────────────────┐
│ Next.js + React + TypeScript │
│ Dashboard / Startup / Cohort │
└──────────────┬───────────────┘
               │ JSON + Bearer JWT
               ▼
┌──────────────────────────────┐
│ Node.js + Express REST API   │
│ Auth · Validation · Services │
└──────────────┬───────────────┘
               │ Parameterized SQL
               ▼
┌──────────────────────────────┐
│ PostgreSQL                   │
│ Users · Programs · Startups  │
│ Milestones                   │
└──────────────────────────────┘

Docker Compose runs the web, API, and database containers.
```

## Run locally (recommended for development)

### Requirements

- Node.js 20 or newer
- npm 10 or newer
- Docker Desktop (for PostgreSQL)

### 1. Start PostgreSQL

From the project root:

```bash
docker compose up -d database
```

The database initializes from `db/init.sql` and creates sample programs, startups, and milestones.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `apps/api/.env.example` to `apps/api/.env` and `apps/web/.env.local.example` to `apps/web/.env.local`. The API environment file points to the Docker database. Change `JWT_SECRET` to a long random value before any public deployment.

### 4. Start frontend and API

```bash
npm run dev
```

- Web application: http://localhost:3000
- REST API health: http://localhost:4000/api/health

Open the web application and create an administrator account from the registration screen. The sample records are already loaded into the database.

## Run the full stack with Docker

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/health
- PostgreSQL: localhost:5432

To stop containers:

```bash
docker compose down
```

To remove the local database volume and reset sample data (destructive):

```bash
docker compose down -v
```

## REST API overview

All routes are prefixed with `/api`. Except health and authentication, routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | API and database health |
| POST | `/auth/register` | Create administrator account |
| POST | `/auth/login` | Authenticate and receive JWT |
| GET | `/dashboard` | KPI totals, status distribution, recent startups |
| GET | `/startups?search=&status=` | Search/filter startups |
| POST | `/startups` | Create startup |
| PATCH | `/startups/:id/status` | Update startup status |
| DELETE | `/startups/:id` | Delete startup |
| GET | `/programs` | List incubation programs and venture counts |
| GET | `/milestones` | List milestones and linked startup names |

### Create startup request example

```json
{
  "name": "NovaHealth",
  "founderName": "Riya Sharma",
  "email": "riya@example.com",
  "sector": "HealthTech",
  "stage": "Prototype",
  "status": "Under Review",
  "programId": null
}
```

## Database model

- `users`: administrator identity, email, password hash, and role.
- `programs`: incubation cohorts, description, status, and dates.
- `startups`: venture details, founder contact, stage, status, and optional program relation.
- `milestones`: venture-linked tasks with due dates and completion state.

## Security and production notes

This is an educational capstone MVP, not a production-certified enterprise system. Before public production use, configure HTTPS, a strong secret manager, secure cookie-based token storage or a hardened session strategy, email verification and password reset, role-based authorization, audit logs, backups, database migrations, observability, automated tests, and stricter CORS/origin settings. Do not commit `.env` or real user data.

## Suggested GitHub repository description

**IncubaCloud is a full-stack enterprise incubation management platform built with Next.js, React, TypeScript, Node.js, Express REST APIs, PostgreSQL, and Docker. It helps incubation teams manage startups, programs, founder records, and venture milestones through a modern analytics dashboard.**

## Capstone submission description

IncubaCloud is a cloud-ready incubation management platform designed to centralize startup and program operations. The frontend is developed using React, Next.js, TypeScript, HTML5, CSS3, and JavaScript. A Node.js and Express backend exposes RESTful endpoints for authentication, dashboard analytics, startup management, program listing, and milestone tracking. PostgreSQL stores user, program, startup, and milestone data in a relational schema with constraints and indexes. Docker Compose orchestrates the frontend, API, and database services. The system includes validated API inputs, password hashing, JWT authentication, parameterized database queries, security headers, and API rate limiting. The project demonstrates a modular full-stack architecture and provides a foundation for future additions such as mentor allocation, document uploads, notifications, role-based access, and advanced analytics.

## Repository structure

```text
incubacloud-platform/
├── apps/
│   ├── api/
│   │   ├── src/server.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/
│       ├── app/page.tsx
│       ├── app/layout.tsx
│       ├── app/globals.css
│       ├── lib/api.ts
│       ├── Dockerfile
│       └── package.json
├── db/init.sql
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

## License

MIT — see `LICENSE`.
