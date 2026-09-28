import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const db = getDatabase();
    let query = `
      SELECT p.*, s.name as supplier_name, u.name as created_by_name
      FROM purchases p
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (from) {
      query += ` AND date(p.purchase_date) >= date(?)`;
      params.push(from);
    }
    if (to) {
      query += ` AND date(p.purchase_date) <= date(?)`;
      params.push(to);
    }

    query += ` ORDER BY p.purchase_date DESC, p.created_at DESC`;

    const purchases = db.prepare(query).all(...params) as any[];

    for (const p of purchases) {
      const items = db.prepare(`
        SELECT pi.*, pv.variant_name, pv.unit, pr.tamil_name as product_name
        FROM purchase_items pi
        JOIN product_variants pv ON pi.variant_id = pv.id
        JOIN products pr ON pv.product_id = pr.id
        WHERE pi.purchase_id = ?
      `).all(p.id);
      p.items = items;
    }

    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();

    return NextResponse.json({ purchases, suppliers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { supplier_name, destination_location, invoice_number, purchase_date, payment_status, items } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in purchase order' }, { status: 400 });
    }

    const db = getDatabase();
    const purchaseId = `po-${Date.now()}`;
    const purchaseCode = `PO-${Date.now().toString().slice(-6)}`;

    // Check or insert supplier
    let supplierId: string | null = null;
    if (supplier_name) {
      const existing = db.prepare('SELECT id FROM suppliers WHERE name = ?').get(supplier_name) as { id: string } | undefined;
      if (existing) {
        supplierId = existing.id;
      } else {
        supplierId = `sup-${Date.now()}`;
        db.prepare('INSERT INTO suppliers (id, name) VALUES (?, ?)').run(supplierId, supplier_name);
      }
    }

    let totalAmount = 0;

    const purchaseTx = db.transaction(() => {
      for (const item of items) {
        totalAmount += item.quantity * item.unit_cost;
      }

      db.prepare(`
        INSERT INTO purchases (
          id, purchase_code, supplier_id, destination_location,
          invoice_number, total_amount, payment_status, purchase_date, created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseId,
        purchaseCode,
        supplierId,
        destination_location || 'warehouse',
        invoice_number || null,
        totalAmount,
        payment_status || 'paid',
        purchase_date || new Date().toISOString().slice(0, 10),
        user.id
      );

      for (const item of items) {
        const subtotal = item.quantity * item.unit_cost;
        db.prepare(`
          INSERT INTO purchase_items (id, purchase_id, variant_id, quantity, unit_cost, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(`poi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, purchaseId, item.variant_id, item.quantity, item.unit_cost, subtotal);

        // Update inventory level
        const destLoc = destination_location || 'warehouse';
        const row = db.prepare('SELECT quantity FROM inventory_levels WHERE variant_id = ? AND location = ?').get(item.variant_id, destLoc) as any;
        if (row) {
          db.prepare('UPDATE inventory_levels SET quantity = quantity + ?, updated_at = datetime("now") WHERE variant_id = ? AND location = ?')
            .run(item.quantity, item.variant_id, destLoc);
        } else {
          db.prepare('INSERT INTO inventory_levels (id, variant_id, location, quantity) VALUES (?, ?, ?, ?)')
            .run(`inv-${destLoc}-${item.variant_id}`, item.variant_id, destLoc, item.quantity);
        }

        // Record movement
        db.prepare(`
          INSERT INTO inventory_movements (
            id, variant_id, movement_type, source_location, destination_location,
            quantity, unit_cost, reference_id, notes, created_by
          )
          VALUES (?, ?, 'purchase', 'supplier', ?, ?, ?, ?, 'Purchase Order Inward', ?)
        `).run(`mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, item.variant_id, destLoc, item.quantity, item.unit_cost, purchaseCode, user.id);
      }
    });

    purchaseTx();
    return NextResponse.json({ success: true, purchaseId, purchaseCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
