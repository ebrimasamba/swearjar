# 🤬 SwearJar

SwearJar is a polished, modern, and mobile-friendly internal office tool designed to track workplace swears, calculate fines, and manage team language with a fun, gamified leaderboard.

It features a dual-mode database client that works instantly in **Demo Mode (LocalStorage)** out-of-the-box, or syncs seamlessly with **Cloud Mode (Supabase)** when environment variables are supplied.

---

## ✨ Features

- **📊 SaaS Dashboard**: Top KPIs (total swears, money owed, averages), rank leaderboard, recent slip-ups, and interactive charts (Bar and Pie).
- **🏆 Offender Trophy**: Highlights the top offender of the current month with a trophy badge.
- **⚡ Quick Add Grid**: Large, tactile employee cards for recording swears in under a second (zero clicks wasted on confirmation dialogs).
- **📝 Contextual Notes**: Option to attach funny or descriptive notes to swears (e.g., *"Declared bankruptcy out loud"* or *"Punched a hole in the wall"*).
- **🕰️ Complete History & Auditing**: Chronological logs with relative timestamps and direct deletion capabilities.
- **👥 Roster Management (CRUD)**: Add employees, edit names, and delete employees with a confirmation warning.
- **⚙️ Dynamic Price Settings**: Change the price per swear; all totals, charts, and statistics update automatically everywhere.
- **📅 Historical Month calculations**: Look back at previous calendar months to audit leaderboards and statistics from past periods without resetting data.
- **🌓 Light & Dark Theme**: Sleek native system theme detection and toggling.
- **🌱 Intelligent Seed Data**: Autopopulates mock data (Dunder Mifflin office characters and historical records) on first load.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Client Components, Server Actions ready)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Tailwind v4)
- **UI Components**: shadcn/ui (Radix UI Primitives, Lucide icons, Sonner notifications)
- **Database**: Supabase (Postgres) or Browser LocalStorage fallback
- **Charts**: Recharts
- **Deployments**: Fully optimized for Vercel

---

## 🚀 Quick Start (Local Run)

1. **Clone the Repository** (or navigate to the project directory).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Run the development server**:
   ```bash
   npm run dev
   ```
4. **Open in browser**: Navigate to [http://localhost:3000](http://localhost:3000).
   > **Note**: Out-of-the-box, the app boots in **Demo Mode** using browser LocalStorage. It automatically seeds itself with sample data representing the Dunder Mifflin office (Michael, Dwight, Jim, Pam, Andy, Angela) and sample historical swears. You can click the settings tab to reset the seed data anytime.

---

## 💾 Database Setup (Supabase / Postgres)

To save data persistently in the cloud:

### 1. Create a Supabase Project
Sign up or log in at [Supabase](https://supabase.com) and create a new Postgres database project.

### 2. Run the SQL Schema
Open the **SQL Editor** in your Supabase dashboard, click "New Query", paste the contents of `schema.sql` (found in the root of this project), and click **Run**. This will:
- Create `employees`, `swears`, and `settings` tables.
- Set up **Row Level Security (RLS)** policies so anyone can perform CRUD (allowing public access for this MVP).
- Insert default settings (price per swear = 5).

### 3. Set Up Environment Variables
Create a file named `.env.local` in the root of the project (copying `.env.example` as a template):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your project's **URL** and **API Anon Key** (found in Project Settings > API).

### 4. Run the Dev Server
```bash
npm run dev
```
The app header will now display a green **Cloud DB** badge indicating it is connected directly to Supabase. Go to **Settings** and click **Seed Supabase Database** to instantly populate the cloud database with mock data.

---

## 📁 File Structure

```
fun-projects/
├── schema.sql                 # Database Schema & RLS Policies
├── .env.example               # Template for environment variables
├── src/
│   ├── app/
│   │   ├── layout.tsx         # App wrapper, ThemeProvider & global shell
│   │   ├── page.tsx           # SaaS Dashboard
│   │   ├── quick-add/         # Quick Add grid screen
│   │   ├── history/           # Audit logs & deletion
│   │   ├── employees/         # Employee CRUD
│   │   ├── settings/          # Price configs & reset tools
│   │   ├── months/            # Historical monthly viewer
│   │   └── globals.css        # Global CSS & animations
│   ├── components/
│   │   ├── Navbar.tsx         # Responsive sticky header
│   │   ├── ThemeToggle.tsx    # Light/Dark mode switcher
│   │   ├── theme-provider.tsx # Next-themes client wrapper
│   │   └── ui/                # UI primitives (buttons, cards, tables, toast)
│   └── lib/
│       ├── db.ts              # Supabase & LocalStorage client abstraction
│       └── utils.ts           # Shared utilities (currency, initials, relative dates)
```

---

## 🌐 Deployment to Vercel

The project is ready to deploy to [Vercel](https://vercel.com):

1. Commit and push your code to a GitHub/GitLab/Bitbucket repository.
2. Link your repository in Vercel.
3. Add the following **Environment Variables** in the Vercel project configuration dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**. Vercel will build and host your production-ready SwearJar web app!
