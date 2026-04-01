# 🗳️ VoteSecure — School E-Voting System

A secure, modern digital voting system built for Ugandan secondary schools.
Built with **Next.js 14**, **Neon (PostgreSQL)**, and **Tailwind CSS**.

---

## Features

### Admin Panel
- Create and manage elections with start/end dates
- Add positions (Head Prefect, Sports Captain, etc.)
- Add candidates per position with class and bio
- Activate / close elections
- Register students with hashed PINs
- Live dashboard with system stats

### Voting (coming soon)
- Students log in with Student ID + PIN
- Secret ballot — votes are anonymous
- One vote per student per election
- Results revealed only after election closes

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | Next.js 14 (App Router)           |
| Styling  | Tailwind CSS                      |
| Database | Neon (serverless PostgreSQL)      |
| Auth     | bcryptjs PIN hashing              |
| Hosting  | Vercel (recommended)              |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Alffy-Alfinega/vote.git
cd vote
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Neon

1. Go to [console.neon.tech](https://console.neon.tech) and create a free project.
2. Copy your **Connection String** from the dashboard.

### 4. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```
DATABASE_URL="postgresql://user:password@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

### 5. Set up the database schema

Paste the contents of `lib/schema.sql` into the **Neon SQL Editor**, or run:

```bash
psql $DATABASE_URL -f lib/schema.sql
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/admin`.

---

## Deploying to Vercel

```bash
npm install -g vercel
vercel
```

Add `DATABASE_URL` in your Vercel project's **Environment Variables** settings.

---

## Project Structure

```
vote/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Sidebar navigation
│   │   ├── page.tsx            # Dashboard
│   │   ├── elections/
│   │   │   ├── page.tsx        # Elections list
│   │   │   ├── new/page.tsx    # Create election
│   │   │   └── [id]/page.tsx   # Manage election + candidates
│   │   └── students/
│   │       └── page.tsx        # Student registry
│   ├── api/
│   │   ├── elections/          # CRUD elections
│   │   ├── positions/          # CRUD positions
│   │   ├── candidates/         # CRUD candidates
│   │   └── students/           # CRUD students (PIN hashed)
│   ├── globals.css
│   └── layout.tsx
├── lib/
│   ├── db.ts                   # Neon query helpers
│   └── schema.sql              # Database schema
├── .env.example
└── README.md
```

---

## Database Design

Votes are stored **without linking to the student who cast them**.
Student participation (who voted) is tracked separately in `voter_records`.
This guarantees ballot secrecy while preventing double voting.

```
elections → positions → candidates
students  → voter_records (who voted, not what they chose)
           → votes (what was chosen, not who chose)
```

---

## Roadmap

- [x] Admin panel — elections, positions, candidates
- [x] Student registry with PIN hashing
- [ ] Student voting interface
- [ ] Real-time results dashboard
- [ ] CSV bulk import for students
- [ ] Printable results certificate
- [ ] Admin authentication (protect the admin panel)
