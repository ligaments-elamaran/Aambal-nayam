export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  is_active: number;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  phone: string | null;
  role: string;
  joining_date: string;
  salary_type: 'monthly' | 'daily' | 'hourly';
  salary_rate: number;
  is_active: number;
  created_at: string;
  // stats
  total_present_days?: number;
  total_working_hours?: number;
  total_overtime_hours?: number;
  estimated_pay?: number;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name?: string;
  employee_code?: string;
  employee_role?: string;
  date: string; // YYYY-MM-DD
  check_in: string | null; // HH:MM
  check_out: string | null; // HH:MM
  break_minutes: number;
  working_hours: number;
  overtime_hours: number;
  status: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave';
  notes: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  category: 'food' | 'retail';
  tamil_name: string;
  english_name: string | null;
  description: string | null;
  is_active: number;
  created_at: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  sku: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  is_active: number;
  created_at: string;
  // stock levels
  store_stock?: number;
  warehouse_stock?: number;
  total_stock?: number;
  tamil_name?: string;
  english_name?: string;
  category?: string;
}

export interface InventoryLevel {
  id: string;
  variant_id: string;
  location: 'store' | 'warehouse';
  quantity: number;
  updated_at: string;
  // joined info
  product_name_tamil?: string;
  product_name_english?: string;
  variant_name?: string;
  sku?: string;
  unit?: string;
  min_stock_level?: number;
  cost_price?: number;
  selling_price?: number;
  category?: string;
}

export interface InventoryMovement {
  id: string;
  variant_id: string;
  movement_type: string;
  source_location: string | null;
  destination_location: string | null;
  quantity: number;
  unit_cost: number | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  product_name?: string;
  variant_name?: string;
}

export interface StockTransfer {
  id: string;
  transfer_code: string;
  source_location: 'warehouse' | 'store';
  destination_location: 'warehouse' | 'store';
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  variant_id: string;
  quantity: number;
  product_name?: string;
  variant_name?: string;
  unit?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  variant_id: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  line_total: number;
}

export interface Sale {
  id: string;
  invoice_number: string;
  cashier_id: string;
  cashier_name?: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  total_cogs: number;
  payment_method: 'cash' | 'upi' | 'card' | 'other';
  status: 'completed' | 'cancelled' | 'returned';
  notes: string | null;
  created_at: string;
  items?: SaleItem[];
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description: string | null;
}

export interface Expense {
  id: string;
  expense_date: string;
  category_id: string;
  category_name?: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'upi' | 'card' | 'bank_transfer';
  vendor_person: string | null;
  created_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProfitLossReport {
  period: { from: string; to: string; label?: string };
  revenue: {
    sales_total: number;
    sales_count: number;
    discounts_given: number;
  };
  cogs: {
    total_cogs: number;
    gross_margin_percent: number;
  };
  gross_profit: number;
  expenses: {
    total_expenses: number;
    by_category: { category_name: string; amount: number; percentage: number }[];
  };
  net_profit: number;
  net_margin_percent: number;
}
