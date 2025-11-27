## Overview

This document covers the workflow for:

- keeping the project in GitHub
- running the stack locally with `.env`
- deploying the production build to Render (web service + managed PostgreSQL)

---

## 1. Publish the repo to GitHub

1. Create a new repository on GitHub (empty main branch, no auto README).
2. In this project directory run:
   ```bash
   git init
   git add .
   git commit -m "Initial import"
   git remote add origin git@github.com:<your-user>/<repo>.git
   git push -u origin main
   ```
3. Render connects directly to GitHub, so pushing to `main` (or any branch) is all that is required for deployments.

---

## 2. Local development

1. Provision Postgres locally (Docker required):
   ```bash
   npm run db:up      # starts postgres:16 on localhost:5432
   ```
   To stop it later: `npm run db:down`
2. Copy the example environment file and edit it with your secrets (connection string already matches the local Docker defaults):
   ```bash
   cp env.example .env
   # edit .env with DATABASE_URL, SESSION_SECRET, PORT
   ```
3. Install dependencies once:
   ```bash
   npm install
   ```
4. Start the dev server (Express API + Vite client):
   ```bash
   npm run dev
   ```
   - The server listens on `http://localhost:5000` by default (change `PORT` if needed).
   - The build pipeline uses `dotenv`, so any variables in `.env` are available automatically.
5. Type checking and production build:
   ```bash
   npm run check        # TypeScript
   npm run deploy:prep  # check + bundle (same commands Render runs)
   ```

---

## 3. Render deployment

You can either import the provided `render.yaml` blueprint or configure the service manually.

### Option A — Blueprint (recommended)

1. Commit `render.yaml` to your repo.
2. In the Render dashboard choose **Blueprints → New Blueprint Instance** and point it at your GitHub repo.
3. Render will provision:
   - `user-blog-db` (PostgreSQL, Free plan)
   - `user-blog-portal` web service (Node 20)
4. After the first build finishes, open the service and set the remaining secrets (Settings → Environment):
   - `SESSION_SECRET`
   - Any other integration keys you need
5. Trigger a manual deploy or push to `main`.

### Option B — Manual setup

1. Create a PostgreSQL instance in Render (or use Neon/Railway/etc.) and copy its connection string.
2. Create a **Web Service**:
   - Deploy from your GitHub repo
   - Build command: `npm install && npm run deploy:prep`
   - Start command: `npm run start`
3. Add environment variables in the service dashboard:
   | Key            | Value                                                       |
   |----------------|-------------------------------------------------------------|
| `NODE_ENV`     | `production`                                                |
| `PORT`         | leave empty (Render injects it automatically)               |
| `DATABASE_URL` | database connection string                                  |
| `SESSION_SECRET` | long random string                                        |
4. Click **Deploy**. Render will run `npm run deploy:prep` (type-check + bundle) followed by `npm run start` which serves both the API and the static client.

---

## 4. Keeping configuration in sync

- Update `.env` locally whenever you add/remove environment variables and mirror them in Render’s dashboard.
- `npm run deploy:prep` is the single source of truth for production builds (also used inside the Render service and the included `Procfile`).
- `render.yaml` can be adjusted (plan sizes, service names, etc.) and will act as IaC for future environments.
