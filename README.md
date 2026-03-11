# Index Mapper

Multi-client SEO content mapping and index-bloat management system. Built for agencies managing 120+ client websites.

## What It Does

Index Mapper helps SEO teams classify every URL on a client's website into one of four action buckets:

- **Keep as is** — Healthy, performing pages
- **Improve / Update** — Pages with value that need work
- **Redirect / Consolidate** — Duplicate or cannibalized pages
- **Remove / Deindex** — Zero-value pages bloating the index

## Workflow

1. Create a client and a project run
2. Upload CSV exports (Screaming Frog, GSC, GA, Ahrefs, etc.)
3. System normalizes, merges, and classifies URLs
4. Review flagged items in the review queue
5. Override any machine recommendations
6. Export the final mapping sheet

## Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL (Neon) via Prisma ORM
- **Auth**: NextAuth.js (credentials)
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)

### Setup

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Push database schema
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed default data (admin user + rule config)
npm run db:seed

# Start dev server
npm run dev
```

### Default Login

```
Email: admin@indexmapper.com
Password: admin123
```

## Deploying to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `DATABASE_URL` — Neon pooled connection string
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — Your Vercel URL
4. Deploy

Build command is already configured: `npx prisma generate && next build`

After first deploy, run the seed against production DB:
```bash
DATABASE_URL="your-prod-db-url" npm run db:seed
```

## Classification Engine

The engine uses three layers:

1. **Hard Rules** — Immediate classification for clear cases (404s, homepage, legal pages)
2. **Weighted Scoring** — 7-dimension scoring across traffic, business value, content quality, backlinks, internal links, topical relevance, and technical health
3. **Manual Review Triggers** — Flags ambiguous cases for human review (conflicting signals, low data, etc.)

See `docs/classification-logic.md` for full details.

## Project Structure

```
src/
├── app/           # Next.js pages and API routes
├── components/    # React components
├── lib/
│   ├── classification/  # Classification engine
│   └── ingestion/       # CSV parsing and normalization
├── server/        # Server actions and queries
└── types/         # TypeScript types and Zod schemas
```

## License

Internal tool — proprietary.
