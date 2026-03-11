# Deployment — Index Mapper

## Infrastructure

- **Hosting**: Vercel (Pro plan recommended for 300s function timeout)
- **Database**: Supabase PostgreSQL
  - Transaction Pooler (port 6543): App queries via `DATABASE_URL`
  - Session Pooler (port 5432): Migrations/DDL via `DIRECT_URL`
- **Google APIs**: Search Console API via OAuth 2.0

## Environment Variables

### Required
```
DATABASE_URL=postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DIRECT_URL=postgresql://...@pooler.supabase.com:5432/postgres?sslmode=require
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXT_PUBLIC_APP_URL=https://index-mapper.vercel.app
```

### Optional
```
CRAWL_MAX_PAGES=500          # Default max pages per crawl
CRAWL_CONCURRENCY=3          # Simultaneous requests
CRAWL_DELAY_MS=200           # Delay between requests
```

## Local Development

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (or local PostgreSQL)
- Google Cloud project with Search Console API enabled

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. `npm install`
4. `npx prisma db push`
5. `npx prisma db seed`
6. `npm run dev`
7. Open http://localhost:3000

## Vercel Deployment

### Build Settings
- Framework: Next.js (auto-detected)
- Build command: `npx prisma generate && next build`
- Output directory: `.next`
- Install command: `npm install`

### Key Vercel Settings
- Function Max Duration: 300s (Pro plan) — needed for crawl batches
- Environment variables: Set all required vars in Vercel dashboard

### Database Migration
After schema changes:
1. Set `DIRECT_URL` to session pooler (port 5432)
2. Run `npx prisma db push` locally against production
3. Or use `npx prisma migrate deploy` for migration-based workflow

## Google Cloud Setup

1. Go to https://console.cloud.google.com
2. Create new project or select existing
3. Enable "Google Search Console API"
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Application type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (dev)
   - `https://index-mapper.vercel.app/api/auth/google/callback` (prod)
7. Copy Client ID and Client Secret to environment variables

## Deployment URL
- Production: https://index-mapper.vercel.app
- GitHub: https://github.com/JLcilliers/index-mapper
