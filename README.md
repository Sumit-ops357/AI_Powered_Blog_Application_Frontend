# Blog Application Frontend

Vue 3 + TypeScript frontend for a blog platform. The app provides public blog discovery, authenticated writing workflows, profile pages, comments, social actions, file uploads, dashboard analytics, and AI writing helpers.

## Tech Stack

- Vue 3 with `<script setup>`
- TypeScript
- Vite
- Vue Router
- Lucide Vue icons

## Prerequisites

- Node.js 20 or newer recommended
- npm
- Backend API running on `http://localhost:8081`

The Vite dev server proxies `/api` and `/uploads` requests to the backend configured in `vite.config.ts`.

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

By default, the frontend runs at:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server.

```bash
npm run build
```

Runs TypeScript checks with `vue-tsc` and creates a production build in `dist/`.

```bash
npm run preview
```

Serves the production build locally for preview.

## Project Structure

```text
src/
  assets/          Static images and SVG assets
  components/      Shared Vue components such as the navbar
  router/          Vue Router route definitions and auth guards
  services/        API client and shared response types
  store/           Lightweight auth session store
  views/           Route-level pages
  App.vue          Root app shell
  main.ts          App bootstrap
  style.css        Global styling
```

## Main Routes

- `/` - public home and blog listing
- `/blog/:id` - public blog detail page
- `/auth` - login and signup page
- `/profile/:id` - public user profile page
- `/editor` - create blog page, requires authentication
- `/editor/:id` - edit blog page, requires authentication
- `/dashboard` - authenticated user dashboard

Unauthenticated users who open protected routes are redirected to `/auth`.

## Backend Integration

The API client is defined in `src/services/api.ts`. It expects the backend to expose endpoints under:

- `/api/auth`
- `/api/blogs`
- `/api/comments`
- `/api/social`
- `/api/files`
- `/api/ai`
- `/api/analytics`

Authentication uses a JWT returned by the backend. The session is stored in `localStorage` under `blog_auth_session`, and authenticated requests automatically include:

```text
Authorization: Bearer <token>
```

## Features

- Signup and login
- Blog listing with search, category, tag, and sorting support
- Blog detail pages with comments
- Create, update, delete, draft, and publish blog workflows
- Author profiles and follow actions
- Like and bookmark actions
- Image/file upload support
- Personal dashboard analytics
- AI helpers for summaries, titles, tags, grammar, and writing suggestions

## Production Build

Create a production build:

```bash
npm run build
```

Preview it locally:

```bash
npm run preview
```

Deploy the generated `dist/` directory to a static hosting provider. Configure the production host or reverse proxy so API and upload requests are forwarded to the backend service.
