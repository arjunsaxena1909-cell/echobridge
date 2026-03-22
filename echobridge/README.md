# 🌉 EchoBridge

A two-way short-form digital storytelling platform connecting **elderly individuals (65–80)** and **teenagers (13–25)** through short audio and video stories within local communities.

**MYP Design — PCUP 2025 | Arjun Saxena**

---

## Quick Setup (3 steps)

### 1. Set up Supabase
1. Go to your Supabase project → **SQL Editor**
2. Paste and run the entire contents of `supabase_setup.sql`
3. That creates all tables, RLS policies, storage bucket, and seed prompts

### 2. Run locally
```bash
npm install
npm run dev
```
Open `http://localhost:5173`

### 3. Deploy to Vercel
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your GitHub repo
3. Add these environment variables in Vercel:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy** ✓

> ⚠️ Never commit your `.env` file — it's in `.gitignore`

---

## Features

| Screen      | Description |
|-------------|-------------|
| Login / SignUp | Email auth with age group selection (Elder / Youth) |
| Home        | Community story feed with reactions |
| Prompts     | Searchable/filterable story prompt library |
| Record      | Audio or video recording up to 60 seconds |
| Conversation | Full story view with threaded comments |
| Profile     | Edit profile, view your stories, stats |
| Rewards     | Badge system tracking your engagement |

## Tech Stack
- **React 18** + Vite
- **React Router v6**
- **Supabase** (Auth, Postgres, Storage)
- **Vercel** (Hosting)
- Plain CSS with design tokens (no Tailwind)
