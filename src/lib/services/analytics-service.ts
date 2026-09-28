import { getDatabase } from '../db';
import { ProfitLossReport } from '@/types';

export class AnalyticsService {
  /**
   * Calculate detailed P&L for a period
   * Gross Profit = Revenue - COGS
   * Net Profit = Gross Profit - Operating Expenses
   */
  static getProfitLoss(from: string, to: string): ProfitLossReport {
    const db = getDatabase();

    // 1. Revenue & COGS
    const salesRow = db.prepare(`
      SELECT 
        COUNT(id) as sales_count,
        COALESCE(SUM(subtotal), 0) as subtotal,
        COALESCE(SUM(discount), 0) as discounts,
        COALESCE(SUM(grand_total), 0) as grand_total,
        COALESCE(SUM(total_cogs), 0) as total_cogs
      FROM sales
      WHERE status = 'completed'
        AND date(created_at) >= date(?)
        AND date(created_at) <= date(?)
    `).get(from, to) as {
      sales_count: number;
      subtotal: number;
      discounts: number;
      grand_total: number;
      total_cogs: number;
    };

    const salesTotal = salesRow.grand_total;
    const cogsTotal = salesRow.total_cogs;
    const grossProfit = salesTotal - cogsTotal;
    const grossMarginPercent = salesTotal > 0 ? Number(((grossProfit / salesTotal) * 100).toFixed(1)) : 0;

    // 2. Expenses breakdown by category
    const expenseRows = db.prepare(`
      SELECT 
        ec.name as category_name,
        COALESCE(SUM(e.amount), 0) as total_amount
      FROM expense_categories ec
      LEFT JOIN expenses e ON e.category_id = ec.id 
        AND date(e.expense_date) >= date(?) 
        AND date(e.expense_date) <= date(?)
      GROUP BY ec.id, ec.name
      HAVING total_amount > 0
      ORDER BY total_amount DESC
    `).all(from, to) as { category_name: string; total_amount: number }[];

    const totalExpenses = expenseRows.reduce((acc, curr) => acc + curr.total_amount, 0);

    const expenseBreakdown = expenseRows.map(row => ({
      category_name: row.category_name,
      amount: row.total_amount,
      percentage: totalExpenses > 0 ? Number(((row.total_amount / totalExpenses) * 100).toFixed(1)) : 0
    }));

    // 3. Net Profit
    const netProfit = grossProfit - totalExpenses;
    const netMarginPercent = salesTotal > 0 ? Number(((netProfit / salesTotal) * 100).toFixed(1)) : 0;

    return {
      period: { from, to },
      revenue: {
        sales_total: salesTotal,
        sales_count: salesRow.sales_count,
        discounts_given: salesRow.discounts
      },
      cogs: {
        total_cogs: cogsTotal,
        gross_margin_percent: grossMarginPercent
      },
      gross_profit: grossProfit,
      expenses: {
        total_expenses: totalExpenses,
        by_category: expenseBreakdown
      },
      net_profit: netProfit,
      net_margin_percent: netMarginPercent
    };
  }

  /**
   * Executive Dashboard KPIs and charts
   */
  static getDashboardMetrics(period: 'today' | 'week' | 'month' = 'today') {
    const db = getDatabase();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    let fromStr = todayStr;
    const toStr = todayStr;

    if (period === 'week') {
      const pastWeek = new Date(now.getTime() - 7 * 86400000);
      fromStr = pastWeek.toISOString().slice(0, 10);
    } else if (period === 'month') {
      fromStr = `${now.toISOString().slice(0, 7)}-01`;
    }

    const pl = this.getProfitLoss(fromStr, toStr);

    // Low stock count (items where store or warehouse is <= min_stock_level)
    const lowStockItems = db.prepare(`
      SELECT 
        il.quantity,
        pv.min_stock_level,
        pv.variant_name,
        pv.unit,
        p.tamil_name,
        p.category,
        il.location
      FROM inventory_levels il
      JOIN product_variants pv ON il.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE il.quantity <= pv.min_stock_level
      LIMIT 10
    `).all() as any[];

    // Active staff today
    const activeStaff = db.prepare(`
      SELECT COUNT(DISTINCT employee_id) as count
      FROM attendance
      WHERE date = ? AND status IN ('present', 'late', 'half_day')
    `).get(todayStr) as { count: number };

    // Top selling products
    const topProducts = db.prepare(`
      SELECT 
        si.product_name,
        si.variant_name,
        SUM(si.quantity) as total_qty,
        SUM(si.line_total) as total_revenue
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'completed'
        AND date(s.created_at) >= date(?)
        AND date(s.created_at) <= date(?)
      GROUP BY si.variant_id
      ORDER BY total_qty DESC
      LIMIT 6
    `).all(fromStr, toStr) as any[];

    // Daily breakdown for charts
    const dailyTrend = db.prepare(`
      SELECT 
        date(s.created_at) as day,
        COALESCE(SUM(s.grand_total), 0) as sales,
        COALESCE(SUM(s.total_cogs), 0) as cogs
      FROM sales s
      WHERE s.status = 'completed'
        AND date(s.created_at) >= date('now', '-7 days')
      GROUP BY date(s.created_at)
      ORDER BY day ASC
    `).all() as any[];

    return {
      period,
      from: fromStr,
      to: toStr,
      pl,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      activeStaffCount: activeStaff.count,
      topProducts,
      dailyTrend
    };
  }
}
