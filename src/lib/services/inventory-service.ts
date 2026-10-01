import { getDatabase } from '../db';
import { InventoryLevel, StockTransfer } from '@/types';

export class InventoryService {
  /**
   * Get inventory levels by location or overall with low-stock flag
   */
  static getStockLevels(location?: 'store' | 'warehouse', lowStockOnly = false) {
    const db = getDatabase();
    let query = `
      SELECT 
        il.id,
        il.variant_id,
        il.location,
        il.quantity,
        il.updated_at,
        pv.product_id,
        p.tamil_name as product_name_tamil,
        p.english_name as product_name_english,
        p.category,
        pv.variant_name,
        pv.sku,
        pv.unit,
        pv.min_stock_level,
        pv.cost_price,
        pv.selling_price
      FROM inventory_levels il
      JOIN product_variants pv ON il.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE pv.is_active = 1
    `;

    const params: unknown[] = [];
    if (location) {
      query += ` AND il.location = ?`;
      params.push(location);
    }
    if (lowStockOnly) {
      query += ` AND il.quantity <= pv.min_stock_level`;
    }

    query += ` ORDER BY p.category ASC, p.tamil_name ASC, pv.selling_price ASC`;

    return db.prepare(query).all(...params) as InventoryLevel[];
  }

  /**
   * Transfer stock between Warehouse and Store atomically
   */
  static transferStock(
    sourceLocation: 'warehouse' | 'store',
    destLocation: 'warehouse' | 'store',
    items: { variant_id: string; quantity: number }[],
    userId?: string,
    notes?: string
  ): { transferId: string; transferCode: string } {
    if (sourceLocation === destLocation) {
      throw new Error('Source and destination locations cannot be identical');
    }
    if (!items || items.length === 0) {
      throw new Error('No items specified for transfer');
    }

    const db = getDatabase();

    const transferId = `trf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const transferCode = `TRF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const runAtomicTransfer = db.transaction(() => {
      // 1. Insert header
      db.prepare(`
        INSERT INTO stock_transfers (id, transfer_code, source_location, destination_location, status, notes, created_by)
        VALUES (?, ?, ?, ?, 'completed', ?, ?)
      `).run(transferId, transferCode, sourceLocation, destLocation, notes || 'Warehouse-Store Stock Movement', userId || null);

      // 2. Validate and adjust items
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error(`Transfer quantity for variant ${item.variant_id} must be greater than zero`);
        }

        // Check source stock
        const sourceRow = db.prepare(`
          SELECT quantity FROM inventory_levels WHERE variant_id = ? AND location = ?
        `).get(item.variant_id, sourceLocation) as { quantity: number } | undefined;

        const currentSourceQty = sourceRow ? sourceRow.quantity : 0;
        if (currentSourceQty < item.quantity) {
          throw new Error(`Insufficient stock in ${sourceLocation} for item. Available: ${currentSourceQty}, Requested: ${item.quantity}`);
        }

        // Deduct from source
        db.prepare(`
          UPDATE inventory_levels 
          SET quantity = quantity - ?, updated_at = datetime('now')
          WHERE variant_id = ? AND location = ?
        `).run(item.quantity, item.variant_id, sourceLocation);

        // Ensure dest row exists, then add
        const destRow = db.prepare(`
          SELECT quantity FROM inventory_levels WHERE variant_id = ? AND location = ?
        `).get(item.variant_id, destLocation) as { quantity: number } | undefined;

        if (destRow) {
          db.prepare(`
            UPDATE inventory_levels 
            SET quantity = quantity + ?, updated_at = datetime('now')
            WHERE variant_id = ? AND location = ?
          `).run(item.quantity, item.variant_id, destLocation);
        } else {
          db.prepare(`
            INSERT INTO inventory_levels (id, variant_id, location, quantity)
            VALUES (?, ?, ?, ?)
          `).run(`inv-${destLocation}-${item.variant_id}`, item.variant_id, destLocation, item.quantity);
        }

        // Insert transfer item row
        db.prepare(`
          INSERT INTO stock_transfer_items (id, transfer_id, variant_id, quantity)
          VALUES (?, ?, ?, ?)
        `).run(`trf-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, transferId, item.variant_id, item.quantity);

        // Audit movement log
        const movType = sourceLocation === 'warehouse' ? 'transfer_warehouse_to_store' : 'transfer_store_to_warehouse';
        db.prepare(`
          INSERT INTO inventory_movements (
            id, variant_id, movement_type, source_location, destination_location,
            quantity, reference_id, notes, created_by
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          item.variant_id,
          movType,
          sourceLocation,
          destLocation,
          item.quantity,
          transferCode,
          notes || 'Stock transfer executed',
          userId || null
        );
      }
    });

    runAtomicTransfer();
    return { transferId, transferCode };
  }

  /**
   * Adjust inventory level (wastage, damage, audit count)
   */
  static adjustStock(
    variantId: string,
    location: 'store' | 'warehouse',
    quantityChange: number,
    movementType: 'adjustment' | 'damage' | 'wastage',
    reason: string,
    userId?: string
  ) {
    const db = getDatabase();

    const runAdjustment = db.transaction(() => {
      // Find current quantity
      const row = db.prepare(`
        SELECT quantity FROM inventory_levels WHERE variant_id = ? AND location = ?
      `).get(variantId, location) as { quantity: number } | undefined;

      const currentQty = row ? row.quantity : 0;
      const newQty = currentQty + quantityChange;

      if (newQty < 0) {
        throw new Error(`Adjustment would result in negative stock: current ${currentQty}, change ${quantityChange}`);
      }

      if (row) {
        db.prepare(`
          UPDATE inventory_levels 
          SET quantity = ?, updated_at = datetime('now')
          WHERE variant_id = ? AND location = ?
        `).run(newQty, variantId, location);
      } else {
        db.prepare(`
          INSERT INTO inventory_levels (id, variant_id, location, quantity)
          VALUES (?, ?, ?, ?)
        `).run(`inv-${location}-${variantId}`, variantId, location, Math.max(0, newQty));
      }

      // Record damage / wastage if applicable
      if (movementType === 'damage' || movementType === 'wastage') {
        const variant = db.prepare('SELECT cost_price FROM product_variants WHERE id = ?').get(variantId) as { cost_price: number } | undefined;
        const estCost = Math.abs(quantityChange) * (variant?.cost_price || 0);

        db.prepare(`
          INSERT INTO wastage_records (id, variant_id, location, quantity, reason, estimated_cost, reported_by)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(`wst-${Date.now()}`, variantId, location, Math.abs(quantityChange), reason, estCost, userId || null);
      }

      // Movement audit
      db.prepare(`
        INSERT INTO inventory_movements (
          id, variant_id, movement_type, source_location, destination_location,
          quantity, reference_id, notes, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        variantId,
        movementType,
        location,
        movementType === 'wastage' || movementType === 'damage' ? 'waste' : location,
        quantityChange,
        'MANUAL-ADJUSTMENT',
        reason,
        userId || null
      );
    });

    runAdjustment();
    return true;
  }

  /**
   * List recent transfers
   */
  static getTransfers(limit = 30): StockTransfer[] {
    const db = getDatabase();
    const transfers = db.prepare(`
      SELECT st.*, u.name as created_by_name
      FROM stock_transfers st
      LEFT JOIN users u ON st.created_by = u.id
      ORDER BY st.created_at DESC
      LIMIT ?
    `).all(limit) as (StockTransfer & { created_by_name?: string })[];

    for (const t of transfers) {
      const items = db.prepare(`
        SELECT sti.*, pv.variant_name, pv.unit, p.tamil_name as product_name
        FROM stock_transfer_items sti
        JOIN product_variants pv ON sti.variant_id = pv.id
        JOIN products p ON pv.product_id = p.id
        WHERE sti.transfer_id = ?
      `).all(t.id) as any[];
      t.items = items;
    }

    return transfers;
  }
}
