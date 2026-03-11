# Deployment — Index Mapper

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm or pnpm
- A PostgreSQL database (Neon recommended for parity with production)

### Steps
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Install dependencies: `npm install`
4. Push database schema: `npx prisma db push`
5. Seed default data: `npx prisma db seed`
6. Start dev server: `npm run dev`
7. Open http://localhost:3000

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
```

## Vercel Deployment

### First-Time Setup
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — Neon connection string (use pooled connection)
   - `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` — Your Vercel deployment URL
4. Deploy

### Database Setup (Neon)
1. Create a Neon project at https://neon.tech
2. Copy the pooled connection string
3. Set as `DATABASE_URL` in Vercel
4. Run `npx prisma db push` against the production database once

### Build Settings
- Framework: Next.js (auto-detected)
- Build command: `npx prisma generate && next build`
- Output directory: `.next`
- Install command: `npm install`

### Post-Deploy
- Verify auth works
- Create initial admin user via seed script or direct DB insert
- Test CSV upload with sample data
