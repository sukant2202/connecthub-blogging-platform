# ConnectHub - Social Media Platform

## Overview

ConnectHub is a full-stack social media web application built as a portfolio project to demonstrate modern web development skills. The platform enables users to create posts, follow other users, like and comment on content, and view a personalized feed of content from people they follow.

**Core Technologies:**
- Frontend: React with TypeScript, TailwindCSS, shadcn/ui components
- Backend: Node.js with Express
- Database: PostgreSQL via Neon serverless with Drizzle ORM
- Authentication: Replit Auth (OpenID Connect) with session-based authentication
- Build Tools: Vite for frontend, esbuild for backend bundling

**Key Features:**
- User authentication and profile management
- Post creation with optional images
- Social interactions (likes, comments, follows)
- Personalized feed based on followed users
- User discovery and suggestions
- Responsive design with dark mode support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure:**
- React with TypeScript using functional components and hooks
- Wouter for client-side routing (lightweight alternative to React Router)
- TanStack Query (React Query) for server state management and caching
- shadcn/ui component library built on Radix UI primitives
- Form handling with React Hook Form and Zod validation

**Styling Approach:**
- TailwindCSS utility-first framework
- Custom design system defined in `design_guidelines.md` inspired by Twitter/X, LinkedIn, and Instagram
- CSS variables for theming with light/dark mode support
- Component variants using class-variance-authority (cva)

**State Management:**
- Server state: TanStack Query with optimistic updates and automatic cache invalidation
- Local state: React hooks (useState, useEffect)
- Theme state: Context API (ThemeProvider)
- Authentication state: Derived from `/api/auth/user` query

**Layout System:**
- Responsive three-column layout on desktop (nav sidebar, main feed, suggestions)
- Two-column on tablet, single column on mobile
- Sticky navigation bar with bottom mobile navigation
- Maximum content widths: feed (max-w-2xl), profile (max-w-4xl), forms (max-w-md)

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- HTTP server creation via Node's `http` module
- Development mode: Vite middleware for HMR
- Production mode: Static file serving from `dist/public`

**API Design:**
- RESTful API endpoints under `/api` prefix
- JSON request/response format
- Authentication middleware (`isAuthenticated`) protecting routes
- Centralized error handling with status codes

**Route Organization:**
- All routes defined in `server/routes.ts`
- Authentication routes: `/api/auth/user`
- User routes: `/api/users/*` (profiles, suggestions, follow actions)
- Post routes: `/api/posts/*` (CRUD, feed, likes, comments)
- Session management via Express sessions

**Authentication Flow:**
- Replit Auth integration using OpenID Connect strategy
- Passport.js for authentication middleware
- Session-based authentication with PostgreSQL session store (connect-pg-simple)
- User data synchronized from Replit Auth claims to local database
- Protected routes redirect unauthenticated users to `/api/login`

### Data Layer

**ORM and Schema:**
- Drizzle ORM for type-safe database queries
- Schema definition in `shared/schema.ts` using Drizzle's table builders
- Zod schemas generated from Drizzle schemas for runtime validation
- Database migrations in `migrations/` directory

**Database Tables:**
- `sessions`: Express session storage for authentication
- `users`: User profiles with email, username, bio, profile images
- `posts`: User-generated content with optional images
- `follows`: Many-to-many relationship for user follows
- `likes`: Many-to-many relationship for post likes
- `comments`: Nested comments on posts with author references

**Data Access Pattern:**
- Storage abstraction layer (`server/storage.ts`) implementing `IStorage` interface
- All database queries go through storage layer methods
- Supports complex queries with joins for author information and interaction counts
- Implements business logic like feed generation (posts from followed users)

**Connection Management:**
- Neon serverless PostgreSQL for production
- WebSocket constructor override for compatibility (`ws` package)
- Connection pooling via `@neondatabase/serverless` Pool
- Environment variable `DATABASE_URL` required for connection

### Build and Deployment

**Development Mode:**
- Vite dev server with HMR for instant feedback
- TypeScript compilation checking via `tsc`
- Database schema push via `drizzle-kit push`
- All processes orchestrated through `npm run dev`

**Production Build:**
- Frontend: Vite builds optimized React app to `dist/public`
- Backend: esbuild bundles server code to single `dist/index.cjs` file
- Selective bundling: Common dependencies bundled, platform-specific externalized
- Build script (`script/build.ts`) coordinates both builds

**Runtime Environment:**
- Node.js runtime with ES modules
- Environment variables for database connection and session secrets
- Production optimizations: code splitting, tree shaking, minification

## External Dependencies

**Authentication Service:**
- Replit Auth (OpenID Connect provider)
- Required environment variables: `REPL_ID`, `ISSUER_URL`, `SESSION_SECRET`
- User profile synchronization on login/signup

**Database Service:**
- Neon Serverless PostgreSQL
- Required environment variable: `DATABASE_URL`
- Automatic connection pooling and WebSocket support

**UI Component Library:**
- shadcn/ui components based on Radix UI primitives
- Provides accessible, customizable components (buttons, dialogs, forms, etc.)
- Configured via `components.json` with path aliases

**Third-Party Packages:**
- TanStack Query: Server state management with caching
- Wouter: Lightweight routing
- date-fns: Date formatting utilities
- Zod: Schema validation
- nanoid: Unique ID generation
- Tailwind CSS: Utility-first styling framework

**Development Tools:**
- Vite: Fast build tool and dev server
- esbuild: Fast JavaScript bundler
- TypeScript: Type safety and tooling
- Drizzle Kit: Database migration tool
- Replit-specific plugins: Cartographer, dev banner, runtime error overlay