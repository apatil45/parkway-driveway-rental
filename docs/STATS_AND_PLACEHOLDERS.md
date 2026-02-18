# Stats and Placeholders in the App

## Where we use **real** stats (from API)

| Location | Source | Data |
|----------|--------|------|
| **Homepage** – "Platform at a Glance" / stats section | `GET /api/stats/public` | totalUsers, activeDriveways, completedBookings, averageRating |
| **About** – "Platform Statistics" | `GET /api/stats/public` | totalUsers, activeDriveways, completedBookings, totalEarnings |
| **Dashboard** | `GET /api/dashboard/stats` | totalBookings, activeBookings, completedOrConfirmedBookings, totalEarnings, averageRating (driver/owner scoped) |
| **Driveway listings** (search, favorites, driveway detail) | Driveway API | averageRating, reviewCount per listing |
| **Testimonials (home)** | Reviews API | Real reviews when available |

## Where we had **placeholder** copy (now updated where possible)

- **"thousands"** – Replaced with real `totalUsers` on Home and About when stats load. Pricing page has no stats fetch so uses generic copy.
- **"4.8★"** – Used only as fallback when `stats.averageRating` is missing/zero; otherwise we show real average rating.
- **"85% / 90%"** – Used in Pricing, Host Guide, and Home as **product/fee** copy (owners keep 85–90% of booking price). This is intentional, not a stat.

## API

- **Public stats:** `apps/web/src/app/api/stats/public/route.ts` – Prisma aggregates for users, driveways, bookings, earnings, average rating.
- **Dashboard stats:** `apps/web/src/app/api/dashboard/stats/route.ts` – Per-user stats (bookings, earnings, rating).
