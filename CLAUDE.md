# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Tea Shop & Organic Retail Management System — a Next.js 15 (App Router) full-stack POS, multi-location inventory, employee attendance, and P&L reporting app for a Tamil heritage tea shop / organic retail store. UI text and product data are bilingual (Tamil/English).

## Commands

```bash
npm install       # install deps
npm run seed      # seed the SQLite DB (scripts/seed-runner.ts -> src/lib/seed.ts)
npm test          # runs tests/verify.ts via tsx (no test framework; script-based checks)
npm run dev       # start Next.js dev server
npm run build     # production build
npm run lint      # next lint
```

There is no per-test filtering — `tests/verify.ts` is a single script. Run it directly with `npx tsx tests/verify.ts` if iterating.

Default demo credentials (seeded): `admin` / `admin123` (full access) and `cashier1` / `cashier123` (POS-only).

## Architecture

**Data layer**: SQLite via `better-sqlite3`, WAL mode, single lazily-initialized connection singleton in `src/lib/db.ts` (`getDatabase()`). Schema lives in `schema.sql` at the repo root and is executed (idempotent `CREATE TABLE IF NOT EXISTS`) every time the DB connection is first opened — so `schema.sql` is the source of truth for tables, not migrations. The live DB file is `tea_shop.db` in the repo root.

Core tables: `users`, `employees`, `attendance`, `products`/`product_variants`, `inventory_levels` (per-location stock: `store` vs `warehouse`), `inventory_movements` (audit trail for stock changes), `stock_transfers`/`stock_transfer_items`, `suppliers`, `purchases`/`purchase_items`, `sales`/`sale_items`, `expense_categories`/`expenses`, `wastage_records`, `audit_logs`.

**Service layer** (`src/lib/services/`): business logic sits here, separate from route handlers. Each service owns one domain and talks to the DB directly via prepared statements:
- `pos-service.ts` — catalog lookup and checkout (atomic sale creation + store inventory deduction).
- `inventory-service.ts` — store/warehouse stock levels, transfers between locations, adjustments, wastage.
- `attendance-service.ts` — clock in/out, working hours and overtime calculation (`Working Hours = (Out - In) - Break`, `OT = Max(0, Working Hours - 8)`), monthly aggregation.
- `analytics-service.ts` — dashboard KPIs and the P&L report (`Gross Profit = Sales Revenue - COGS`, `Net Profit = Gross Profit - Operating Expenses`).

API routes under `src/app/api/**/route.ts` are thin wrappers that call into these services; keep new business logic in the service layer rather than in route handlers.

**Auth**: JWT (via `jose`) stored in an HTTP-only cookie (`tea_shop_session`), issued/verified in `src/lib/auth.ts`. `getCurrentUser()` reads the cookie, verifies the JWT, then re-fetches the user row from `users` by id (so DB is the source of truth for role/active-status, not just the token claims). Roles are `admin` and `cashier`.

**Route protection**: `src/middleware.ts` gates all non-API, non-`/login` pages — any request without the session cookie is redirected to `/login`. API routes do their own auth checks internally (middleware explicitly passes `/api/*` through). When adding a new top-level page, no middleware change is needed (the matcher already covers it); when adding a new API route, add its own auth/role check.

**Frontend**: App Router pages under `src/app/<feature>/page.tsx` (`pos`, `inventory`, `menu`, `attendance`, `expenses`, `reports/profit-loss`, `login`). Styling is Tailwind CSS; icons from `lucide-react`. Shared chrome lives in `src/components/navbar.tsx`.

**Types**: all cross-cutting domain types (`User`, `Product`, `ProductVariant`, `Sale`, `Expense`, `ProfitLossReport`, etc.) are centralized in `src/types/index.ts` — check there before redefining shapes returned by services/routes.
