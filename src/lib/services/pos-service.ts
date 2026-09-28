import { getDatabase } from '../db';
import { Sale, SaleItem } from '@/types';

export class POSService {
  /**
   * Return POS catalog: active items with store stock count
   */
  static getCatalog() {
    const db = getDatabase();
    return db.prepare(`
      SELECT 
        pv.id as variant_id,
        p.id as product_id,
        p.category,
        p.tamil_name,
        p.english_name,
        pv.variant_name,
        pv.sku,
        pv.unit,
        pv.selling_price,
        pv.cost_price,
        pv.min_stock_level,
        COALESCE(il.quantity, 0) as store_stock
      FROM product_variants pv
      JOIN products p ON pv.product_id = p.id
      LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location = 'store'
      WHERE pv.is_active = 1 AND p.is_active = 1
      ORDER BY p.category ASC, p.tamil_name ASC
    `).all() as any[];
  }

  /**
   * Atomic POS Checkout: create sale, sale items, deduct store inventory, audit movements
   */
  static checkout(
    cashierId: string,
    items: { variant_id: string; quantity: number; unit_price?: number }[],
    paymentMethod: 'cash' | 'upi' | 'card' | 'other' = 'cash',
    discount: number = 0,
    notes?: string
  ): { sale: Sale; invoiceNumber: string } {
    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }

    const db = getDatabase();

    const saleId = `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let subtotal = 0;
    let totalCogs = 0;
    const resolvedItems: (SaleItem & { stockBefore: number })[] = [];

    const runCheckout = db.transaction(() => {
      // 1. Validate items, pricing and store stock
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error('Invalid item quantity');
        }

        const variantRow = db.prepare(`
          SELECT 
            pv.id, pv.cost_price, pv.selling_price, pv.variant_name,
            p.tamil_name, p.english_name,
            COALESCE(il.quantity, 0) as store_stock
          FROM product_variants pv
          JOIN products p ON pv.product_id = p.id
          LEFT JOIN inventory_levels il ON il.variant_id = pv.id AND il.location = 'store'
          WHERE pv.id = ?
        `).get(item.variant_id) as any;

        if (!variantRow) {
          throw new Error(`Product variant not found: ${item.variant_id}`);
        }

        // Check if sufficient stock in store
        if (variantRow.store_stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${variantRow.tamil_name} (${variantRow.variant_name})". Available in store: ${variantRow.store_stock}, requested: ${item.quantity}`
          );
        }

        const price = item.unit_price ?? variantRow.selling_price;
        const lineTotal = price * item.quantity;
        const lineCost = variantRow.cost_price * item.quantity;

        subtotal += lineTotal;
        totalCogs += lineCost;

        resolvedItems.push({
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          sale_id: saleId,
          variant_id: item.variant_id,
          product_name: `${variantRow.tamil_name} ${variantRow.english_name ? `(${variantRow.english_name})` : ''}`,
          variant_name: variantRow.variant_name,
          quantity: item.quantity,
          unit_price: price,
          unit_cost: variantRow.cost_price,
          line_total: lineTotal,
          stockBefore: variantRow.store_stock,
        });
      }

      const grandTotal = Math.max(0, subtotal - discount);

      // 2. Insert Sale Header
      db.prepare(`
        INSERT INTO sales (
          id, invoice_number, cashier_id, subtotal, discount, tax,
          grand_total, total_cogs, payment_method, status, notes
        )
        VALUES (?, ?, ?, ?, ?, 0.0, ?, ?, ?, 'completed', ?)
      `).run(saleId, invoiceNumber, cashierId, subtotal, discount, grandTotal, totalCogs, paymentMethod, notes || null);

      // 3. Insert Sale Items and Deduct Store Stock atomically
      for (const item of resolvedItems) {
        db.prepare(`
          INSERT INTO sale_items (
            id, sale_id, variant_id, product_name, variant_name,
            quantity, unit_price, unit_cost, line_total
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(item.id, saleId, item.variant_id, item.product_name, item.variant_name, item.quantity, item.unit_price, item.unit_cost, item.line_total);

        // Deduct store stock
        db.prepare(`
          UPDATE inventory_levels
          SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE variant_id = ? AND location = 'store'
        `).run(item.quantity, item.variant_id);

        // Audit movement
        db.prepare(`
          INSERT INTO inventory_movements (
            id, variant_id, movement_type, source_location, destination_location,
            quantity, unit_cost, reference_id, notes, created_by
          )
          VALUES (?, ?, 'sale', 'store', 'customer', ?, ?, ?, ?, ?)
        `).run(
          `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          item.variant_id,
          item.quantity,
          item.unit_cost,
          invoiceNumber,
          `POS Sale ${invoiceNumber}`,
          cashierId
        );
      }
    });

    runCheckout();

    const createdSale: Sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      cashier_id: cashierId,
      subtotal,
      discount,
      tax: 0,
      grand_total: Math.max(0, subtotal - discount),
      total_cogs: totalCogs,
      payment_method: paymentMethod,
      status: 'completed',
      notes: notes || null,
      created_at: new Date().toISOString(),
      items: resolvedItems,
    };

    return { sale: createdSale, invoiceNumber };
  }

  /**
   * Get sales history with filtering
   */
  static getSales(from?: string, to?: string, paymentMethod?: string, limit = 50): Sale[] {
    const db = getDatabase();
    let query = `
      SELECT s.*, u.name as cashier_name
      FROM sales s
      JOIN users u ON s.cashier_id = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (from) {
      query += ` AND date(s.created_at) >= date(?)`;
      params.push(from);
    }
    if (to) {
      query += ` AND date(s.created_at) <= date(?)`;
      params.push(to);
    }
    if (paymentMethod && paymentMethod !== 'all') {
      query += ` AND s.payment_method = ?`;
      params.push(paymentMethod);
    }

    query += ` ORDER BY s.created_at DESC LIMIT ?`;
    params.push(limit);

    const sales = db.prepare(query).all(...params) as Sale[];

    for (const sale of sales) {
      const items = db.prepare(`
        SELECT * FROM sale_items WHERE sale_id = ?
      `).all(sale.id) as SaleItem[];
      sale.items = items;
    }

    return sales;
  }
}
