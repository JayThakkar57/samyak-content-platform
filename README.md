# Samyak Content Delivery Platform

A premium, production-ready content delivery platform built with Next.js 14, MongoDB, and Notion as the CMS.

## Features

- 🔐 **JWT Auth** with role-based access (admin / student)
- 📚 **Curriculum hierarchy:** Programs → Modules → Chapters → Lessons
- 🔗 **Notion API integration** — paste a Notion page URL, sync to platform
- 🎨 **Notion-style block renderer** (headings, lists, callouts, images, videos, code, tables, toggles)
- 👥 **Student management** with program assignment (admin assigns programs to students)
- 🔒 **Student isolation** — students only see assigned + published programs
- 📊 **Admin dashboard** with stats and recent activity
- 🎯 **Premium SaaS UI** — white/blue theme with shadcn/ui

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, JWT, bcrypt
- **Database:** MongoDB (Atlas recommended for production)
- **CMS:** Notion API (`@notionhq/client`)

## Quick Start (Local Development)

```bash
# Install dependencies
yarn install

# Copy environment variables and fill in your values
cp .env.example .env

# Edit .env with your MongoDB URL, JWT secret, Notion API key

# Run dev server
yarn dev
```

App will be available at http://localhost:3000

Default admin (auto-seeded on first login page visit):
- Email: `admin@samyak.com`
- Password: `admin123` (CHANGE THIS IMMEDIATELY in Settings)

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repo
4. Add environment variables in Vercel dashboard:
   - `MONGO_URL`
   - `DB_NAME`
   - `JWT_SECRET`
   - `NOTION_API_KEY`
   - `NOTION_VERSION`
   - `NEXT_PUBLIC_BASE_URL` (your Vercel deployment URL)
   - `CORS_ORIGINS=*`
5. Click Deploy

## Notion Integration Setup

1. Create an integration at https://www.notion.so/profile/integrations
2. Copy the **Internal Integration Secret** (`ntn_...`) into `NOTION_API_KEY`
3. For each Notion page you want to use as a lesson:
   - Open the page → `•••` (top right) → **Connections** → Add your integration
   - Or share the parent page so all child pages inherit access

## Usage

### As Admin

1. Login at `/login` with admin credentials
2. Create Programs → Modules → Chapters → Lessons
3. For each lesson, paste the Notion page URL
4. Click the sync button (🔄) to fetch content from Notion
5. Create Students and assign Programs

### As Student

1. Login with credentials provided by admin
2. See assigned programs on dashboard
3. Click a program to read lessons in a Notion-style viewer

## License

MIT
