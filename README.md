# KIXORA — Sneaker Marketplace

> Built with Next.js 14 + Express.js in plain JavaScript. No TypeScript.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (JS), Tailwind CSS, React Query, Zustand |
| Backend | Node.js + Express (JS) |
| Database | PostgreSQL + Prisma 5 (Neon) |
| Cache | Redis (Upstash) + in-memory fallback |
| Auth | JWT (access + refresh tokens) |
| Real-time | Socket.io |
| Images | Cloudinary |
| Payments | Stripe |
| Email | Resend |

## Design System

- **Black** `#0A0A0A` · **Amber** `#F5A623` · **Off-white** `#F5F4F0`
- Fonts: Bebas Neue (display) + Inter (body)

---

## Quick Start

### 1. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in your env vars (see below)

npm install
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js

npm run dev   # runs on port 5000
```

### 2. Frontend setup

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000

npm install
npm run dev   # runs on port 3000
```

---

## Environment Variables

### Backend `.env`

```env
NODE_ENV=development
PORT=5000

# Neon PostgreSQL
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# JWT
JWT_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# Upstash Redis (optional — falls back to in-memory in dev)
REDIS_URL=redis://...

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# Google OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

CLIENT_URL=http://localhost:3000
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...
```

---

## Test Accounts (after seed)

| Email | Password | Role |
|---|---|---|
| admin@kixora.com | admin123! | Admin |
| buyer@kixora.com | buyer123! | Buyer |
| seller@kixora.com | seller123! | Seller |

---

## Pages

| Route | Description |
|---|---|
| `/` | Landing page with hero, drops, featured listings |
| `/marketplace` | Full marketplace with instant client-side filters |
| `/product/[id]` | Product detail with buy now, offer, price history chart |
| `/auctions` | Live auctions listing |
| `/auctions/[id]` | Live auction with real-time bidding |
| `/drops` | Upcoming drop calendar |
| `/community` | Social feed with posts, reactions |
| `/vault` | Personal collection tracker with portfolio chart |
| `/orders` | Buying and selling order history |
| `/messages` | Real-time chat between users |
| `/notifications` | Activity notifications |
| `/seller` | Seller dashboard — listings, offers, revenue |
| `/admin` | Admin panel — users, listings review, orders |
| `/profile/[username]` | Public user profile |
| `/settings` | Account settings — profile, password, notifications |
| `/auth/login` | Login |
| `/auth/register` | Register |

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me

GET    /api/listings           (filters: search, brand, condition, size, minPrice, maxPrice, sort, page)
GET    /api/listings/featured
GET    /api/listings/:id
POST   /api/listings
PATCH  /api/listings/:id
DELETE /api/listings/:id

GET    /api/products
GET    /api/products/:id

GET    /api/auctions
GET    /api/auctions/:id
POST   /api/auctions/:id/bid

GET    /api/offers
GET    /api/offers/received
POST   /api/offers
PATCH  /api/offers/:id/accept
PATCH  /api/offers/:id/reject

GET    /api/orders
GET    /api/orders/buying
GET    /api/orders/selling
POST   /api/orders
GET    /api/orders/:id
POST   /api/orders/:id/confirm

GET    /api/vault
POST   /api/vault
DELETE /api/vault/:id

GET    /api/drops
GET    /api/drops/:id
POST   /api/drops/:id/enter

GET    /api/community
POST   /api/community
POST   /api/community/:id/like

GET    /api/messages/conversations
POST   /api/messages/conversations
GET    /api/messages/:id
POST   /api/messages/:id/send

GET    /api/notifications
PATCH  /api/notifications/read-all
PATCH  /api/notifications/:id/read

GET    /api/seller/stats
GET    /api/seller/listings

GET    /api/search?q=...

POST   /api/uploads/image

GET    /api/admin/stats
GET    /api/admin/users
GET    /api/admin/listings
GET    /api/admin/orders
```

---

## Key Patterns (Plain JS)

- **No TypeScript** — plain `.js` everywhere
- **No `.toNumber()`** — use `Number(value)` for Prisma Decimal fields
- **Redis fallback** — in-memory Map used automatically when Redis isn't configured
- **Rate limiter** — 10,000 req/window in development (effectively off)
- **`req.user`** — plain object `{ id, role, email }` set by auth middleware
- **All frontend pages** — `'use client'` directive, no Server Components
- **Filters** — client-side state, debounced API calls, URL sync

---

Built for Khit · KIXORA v2 · June 2026
