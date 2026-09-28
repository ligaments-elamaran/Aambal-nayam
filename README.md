# பாரம்பரிய சுவை தேநீர் அரங்கம் (Tea Shop & Organic Retail Management)

A comprehensive Full-Stack Point of Sale (POS), Multi-location Inventory, Employee Attendance, and Financial P&L Management System built for traditional tea shops and organic heritage retail stores.

---

## 🌟 Key Features

1. **Point of Sale (POS) Counter** (`/pos`):
   - Fast, touch-friendly UI designed for speed during peak hours.
   - Category filters: *All, Tea & Snacks, Cold Pressed Oils, Heritage Rice, Fresh Produce*.
   - Live store inventory indicator on each item card.
   - Payment modes: **Cash** (with automated change calculation), **UPI / QR Code**, and **Card**.
   - Printable thermal-format receipt.
   - Atomic store inventory deduction upon checkout.

2. **Multi-Location Inventory Management** (`/inventory`):
   - Distinct stock tracking for **Store** (sales counter) vs. **Warehouse** (bulk backroom).
   - Atomic **Stock Transfer** workflow (`Warehouse ↔ Store`) with audit trail.
   - **Low Stock Alerts** based on configurable threshold per SKU.
   - **Wastage & Damage Logging** to record kitchen spoils or packaging leakage with automated cost estimation.

3. **Traditional Tamil & Retail Menu Catalog** (`/menu`):
   - Native UTF-8 Tamil names alongside English descriptions.
   - Cold-pressed oils with packaging sizes: **200ml, 500ml, 1 Litre**.
   - Heritage traditional rice variants (கருப்பு கவுணி, மாப்பிள்ளை சம்பா, காட்டு யாகம், ரத்தசாலி, etc.) with packaging sizes: **500g, 1kg, 5kg**.
   - Snacks & Drinks: செம்பருத்தி பால், முருங்கை கீரை வடை, இளநீர் பாயாசம், அம்மினி கொழுக்கட்டை, etc.

4. **Employee Attendance & Overtime Module** (`/attendance`):
   - Pre-seeded with initial 4 employees:
     - **EMP001**: Murugan K. (Tea Master, Daily wage ₹600)
     - **EMP002**: Selvan M. (Kitchen Assistant, Daily wage ₹500)
     - **EMP003**: Anitha R. (Counter Cashier, Monthly ₹15,000)
     - **EMP004**: Prakash V. (Store & Delivery Assistant, Monthly ₹14,000)
   - Clock-in, Clock-out, and break duration tracking.
   - Automated working hours & overtime calculation (`Working Hours = (Out - In) - Break`, `OT = Max(0, Working Hours - 8)`).
   - Monthly hours aggregation.

5. **Expenses & P&L Statement Engine** (`/expenses` & `/reports/profit-loss`):
   - Daily operational expense tracking across categories (Milk, Gas cylinder, Rent, Wages, Packaging, Electricity, etc.).
   - Standard Financial Equations:
     - `Gross Profit = Sales Revenue - Cost of Goods Sold (COGS)`
     - `Net Profit = Gross Profit - Operating Expenses`
   - Real-time KPI cards and date filtering.

6. **Authentication & Role-Based Navigation**:
   - JWT sessions in HTTP-only cookies.
   - Demo 1-click switch between **Admin** (full access) and **Cashier** (POS counter).

---

## 🛠️ Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide Icons
- **Database**: SQLite with `better-sqlite3` (WAL mode enabled)
- **Security**: `jose` (JWT) & `bcryptjs`

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run Database Seeding
npm run seed

# 3. Run Verification Tests
npm test

# 4. Start Dev Server
npm run dev
```

Default credentials:
- **Admin**: `admin` / `admin123`
- **Cashier**: `cashier1` / `cashier123`
