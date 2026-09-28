PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Users / Authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'cashier')),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  employee_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  joining_date TEXT NOT NULL,
  salary_type TEXT NOT NULL CHECK(salary_type IN ('monthly', 'daily', 'hourly')),
  salary_rate REAL NOT NULL DEFAULT 0.0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Attendance Records
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date TEXT NOT NULL, -- YYYY-MM-DD
  check_in TEXT,      -- HH:MM
  check_out TEXT,     -- HH:MM
  break_minutes INTEGER DEFAULT 0,
  working_hours REAL DEFAULT 0.0,
  overtime_hours REAL DEFAULT 0.0,
  status TEXT NOT NULL CHECK(status IN ('present', 'late', 'half_day', 'absent', 'on_leave')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(employee_id, date)
);

-- Products (Food & Retail items)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK(category IN ('food', 'retail')),
  tamil_name TEXT NOT NULL,
  english_name TEXT,
  description TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Product Variants / SKUs
CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  unit TEXT NOT NULL,
  cost_price REAL NOT NULL DEFAULT 0.0,
  selling_price REAL NOT NULL,
  min_stock_level REAL DEFAULT 5.0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Inventory Balances per Location
CREATE TABLE IF NOT EXISTS inventory_levels (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  location TEXT NOT NULL CHECK(location IN ('store', 'warehouse')),
  quantity REAL NOT NULL DEFAULT 0.0,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(variant_id, location)
);

-- Inventory Movements / Audit Ledger
CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK(movement_type IN (
    'opening_stock', 'purchase', 'sale', 'transfer_warehouse_to_store',
    'transfer_store_to_warehouse', 'adjustment', 'damage', 'wastage', 'return'
  )),
  source_location TEXT CHECK(source_location IN ('store', 'warehouse', 'supplier', 'customer')),
  destination_location TEXT CHECK(destination_location IN ('store', 'warehouse', 'supplier', 'customer', 'waste')),
  quantity REAL NOT NULL,
  unit_cost REAL,
  reference_id TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Stock Transfers
CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  transfer_code TEXT UNIQUE NOT NULL,
  source_location TEXT NOT NULL CHECK(source_location IN ('warehouse', 'store')),
  destination_location TEXT NOT NULL CHECK(destination_location IN ('warehouse', 'store')),
  status TEXT NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity REAL NOT NULL
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  purchase_code TEXT UNIQUE NOT NULL,
  supplier_id TEXT REFERENCES suppliers(id),
  destination_location TEXT NOT NULL CHECK(destination_location IN ('store', 'warehouse')),
  invoice_number TEXT,
  total_amount REAL NOT NULL,
  payment_status TEXT NOT NULL CHECK(payment_status IN ('paid', 'pending', 'partial')),
  purchase_date TEXT NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS purchase_items (
  id TEXT PRIMARY KEY,
  purchase_id TEXT NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  quantity REAL NOT NULL,
  unit_cost REAL NOT NULL,
  subtotal REAL NOT NULL
);

-- Sales / POS Invoices
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  cashier_id TEXT NOT NULL REFERENCES users(id),
  subtotal REAL NOT NULL,
  discount REAL NOT NULL DEFAULT 0.0,
  tax REAL NOT NULL DEFAULT 0.0,
  grand_total REAL NOT NULL,
  total_cogs REAL NOT NULL DEFAULT 0.0,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'card', 'other')),
  status TEXT NOT NULL CHECK(status IN ('completed', 'cancelled', 'returned')) DEFAULT 'completed',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sale_items (
  id TEXT PRIMARY KEY,
  sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  unit_cost REAL NOT NULL DEFAULT 0.0,
  line_total REAL NOT NULL
);

-- Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  expense_date TEXT NOT NULL,
  category_id TEXT NOT NULL REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'upi', 'card', 'bank_transfer')),
  vendor_person TEXT,
  created_by TEXT REFERENCES users(id),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Wastage & Damages
CREATE TABLE IF NOT EXISTS wastage_records (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL REFERENCES product_variants(id),
  location TEXT NOT NULL CHECK(location IN ('store', 'warehouse')),
  quantity REAL NOT NULL,
  reason TEXT NOT NULL,
  estimated_cost REAL NOT NULL,
  reported_by TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- System Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  table_affected TEXT NOT NULL,
  record_id TEXT,
  old_data TEXT,
  new_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
