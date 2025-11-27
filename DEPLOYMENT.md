## Overview

This document covers the workflow for:

- keeping the project in GitHub
- running the stack locally with `.env`
- deploying the production build to Render (web service + MongoDB)

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

1. Provision MongoDB locally (Docker required):
   ```bash
   npm run db:up      # starts mongo:7 on localhost:27017
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

> **Note:** MongoDB will automatically create collections and indexes as needed when you first use the application. No manual schema setup is required.

---

## 3. Render deployment

Render's managed databases are PostgreSQL by default. For MongoDB, you'll need to use **MongoDB Atlas** (free tier available) or another MongoDB service.

### Step 1: Set up MongoDB Atlas (Free)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account and cluster (M0 Free tier)
3. Create a database user:
   - Go to **Database Access** → **Add New Database User**
   - Choose **Password** authentication
   - Save the username and password
4. Whitelist Render's IPs:
   - Go to **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (or add Render's IP ranges)
5. Get your connection string:
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string (it looks like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<username>` and `<password>` with your database user credentials
   - Add your database name at the end: `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/user_blog_portal?retryWrites=true&w=majority`

### Step 2: Deploy to Render

You can either import the provided `render.yaml` blueprint or configure the service manually.

#### Option A — Blueprint (recommended)

1. Commit `render.yaml` to your repo.
2. In the Render dashboard choose **Blueprints → New Blueprint Instance** and point it at your GitHub repo.
3. Render will provision the `user-blog-portal` web service.
4. **Important:** After the first build finishes, open the service and set the environment variables (Settings → Environment):
   - `DATABASE_URL` - Your MongoDB Atlas connection string (from Step 1)
   - `SESSION_SECRET` - A long random string (generate one: `openssl rand -base64 32`)
5. Trigger a manual deploy or push to `main`.

#### Option B — Manual setup

1. Create a **Web Service** in Render:
   - Deploy from your GitHub repo
   - Build command: `npm install --include=dev && npm run deploy:prep`
   - Start command: `npm run start`
2. Add environment variables in the service dashboard:
   | Key            | Value                                                       |
   |----------------|-------------------------------------------------------------|
   | `NODE_ENV`     | `production`                                                |
   | `PORT`         | leave empty (Render injects it automatically)               |
   | `DATABASE_URL` | Your MongoDB Atlas connection string (mongodb+srv://...)     |
   | `SESSION_SECRET` | Long random string (use `openssl rand -base64 32`)        |
3. Click **Deploy**. Render will run `npm run deploy:prep` (type-check + bundle) followed by `npm run start` which serves both the API and the static client.

### Step 3: Verify Deployment

1. Check the Render logs to ensure the MongoDB connection is successful
2. Visit your Render service URL
3. Try creating an account and posting

---

## 4. Troubleshooting

### MongoDB Connection Issues

If you see "Invalid scheme" errors:
- Ensure `DATABASE_URL` starts with `mongodb://` or `mongodb+srv://`
- Verify your MongoDB Atlas connection string is correct
- Check that your MongoDB Atlas IP whitelist includes Render's IPs (or allows all IPs)
- Verify your database user credentials are correct

### Common Issues

- **"Failed to connect to MongoDB"**: Check your `DATABASE_URL` in Render's environment variables
- **"Invalid scheme"**: Your connection string format is incorrect
- **"Authentication failed"**: Verify your MongoDB Atlas username and password

---

## 5. Keeping configuration in sync

- Update `.env` locally whenever you add/remove environment variables and mirror them in Render's dashboard.
- `npm run deploy:prep` is the single source of truth for production builds (also used inside the Render service and the included `Procfile`).
- `render.yaml` can be adjusted (plan sizes, service names, etc.) and will act as IaC for future environments.
