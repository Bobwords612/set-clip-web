# Set-Clip Web

A web application for comedians to search, preview, and purchase recordings of their comedy sets.

## Features

- **Search by Name**: Find clips by performer name
- **Preview**: Watch a short preview before purchasing
- **Stripe Checkout**: Secure payment processing
- **Instant Downloads**: Get your clips immediately after purchase
- **Multiple Formats**: Original quality, social media (9:16 with subtitles), and SRT files

## Architecture

```
set-clip (local app)
  - Processes video recordings
  - Writes clip metadata to Supabase
  - Stores files on Synology NAS
         |
         v
Supabase (Database)
  - Clips, shows, performers, purchases
  - Shared between local app and web app
         |
         v
set-clip-web (this app - Vercel)
  - Search UI
  - Stripe checkout
  - Download link generation
```

## Setup

### 1. Supabase Setup

1. Create a new project at supabase.com
2. Go to SQL Editor and run the schema from `supabase/schema.sql`
3. Get your project URL and keys from Settings > API

### 2. Stripe Setup

1. Create a Stripe account at stripe.com
2. Get your API keys from Developers > API keys
3. Set up a webhook endpoint pointing to `/api/webhook`
4. Add the webhook secret to your environment

### 3. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLIP_PRICE_CENTS=500
```

### 4. Run Locally

```bash
npm install
npm run dev
```

### 5. Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Database Schema

### Tables

- **venues**: Comedy venues (name, location)
- **shows**: Individual show instances
- **performers**: Performer records (for name matching)
- **clips**: Video clips with file paths and metadata
- **purchases**: Purchase records with download tokens
- **download_logs**: Download tracking

## API Routes

- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/webhook` - Handle Stripe webhooks
- `GET /api/download/[token]` - Download purchased files

## Local App Integration

The local set-clip app needs to connect to the same Supabase database
and create clip records after processing videos.

## Development

```bash
npm run dev    # Run dev server
npm run lint   # Type check
npm run build  # Build for production
```
