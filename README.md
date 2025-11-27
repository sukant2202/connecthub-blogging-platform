# ConnectHub

Full-stack social platform built with React + TypeScript on the frontend and Express + Mongoose/MongoDB on the backend. Users can sign in with email/username, create posts, follow people, like/comment, and browse the global feed.

![Landing](client/public/landing.png)

## Tech stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, TanStack Query, Wouter
- **Backend**: Node.js 20, Express, Mongoose ODM, MongoDB (locally via Docker; Render in production)
- **Auth**: Session-based email/username login + password hashing (bcrypt)
- **Build**: Vite + esbuild bundling via `npm run deploy:prep`

## Getting started

1. Clone and install dependencies
   ```bash
   git clone <repo>
   cd UserBlogPortal
   npm install
   ```

2. Start MongoDB locally (Docker required)
   ```bash
   npm run db:up        # spins up mongo:7 on localhost:27017
   ```

3. Configure environment
   ```bash
   cp env.example .env
   # edit .env with SESSION_SECRET, DATABASE_URL (defaults to local docker), PORT
   ```

4. Run dev server
   ```bash
   npm run dev          # Express API + Vite client on http://localhost:5000
   ```

5. Tests/build
   ```bash
   npm run check        # TypeScript check
   npm run deploy:prep  # same build Render runs (type-check + bundle)
   ```

## Deploying to Render

1. Push the repo to GitHub (instructions in `DEPLOYMENT.md`).
2. Set up MongoDB Atlas (free tier) - see `DEPLOYMENT.md` for detailed steps.
3. Either import `render.yaml` as a blueprint or create a Web Service manually:
   - Build: `npm install --include=dev && npm run deploy:prep`
   - Start: `npm run start`
4. Required environment variables in Render:
   ```
   NODE_ENV=production
   DATABASE_URL=<MongoDB Atlas connection string (mongodb+srv://...)>
   SESSION_SECRET=<long random string>
   ```
5. Render runs the bundled server (Express serves API + static client) on the provided port.

> **Note:** Render's managed databases are PostgreSQL. For MongoDB, use MongoDB Atlas (free tier available).

## Project scripts

| Command             | Description                                  |
|---------------------|----------------------------------------------|
| `npm run dev`       | Dev server (Express + Vite)                   |
| `npm run check`     | TypeScript type-check                        |
| `npm run deploy:prep` | Type-check + production build               |
| `npm run db:up`     | Start local MongoDB (Docker compose)        |
| `npm run db:down`   | Stop local MongoDB                          |

## Folder structure

```
client/          React app
server/          Express API + auth + storage layer
shared/          Mongoose schema shared across client/server
script/build.ts  Production bundler (Vite + esbuild)
render.yaml      Render blueprint (web service + MongoDB)
DEPLOYMENT.md    Step-by-step guide for GitHub + Render
```

## License

MIT © 2025 ConnectHub. Feel free to fork and customize. Contributions welcome!
