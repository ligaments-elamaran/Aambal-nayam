import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const db = getDatabase();
    let query = `SELECT * FROM products WHERE is_active = 1`;
    const params: unknown[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }
    if (search) {
      query += ` AND (tamil_name LIKE ? OR english_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY category ASC, tamil_name ASC`;

    const products = db.prepare(query).all(...params) as any[];

    for (const prod of products) {
      const variants = db.prepare(`
        SELECT pv.*, 
          COALESCE(s.quantity, 0) as store_stock,
          COALESCE(w.quantity, 0) as warehouse_stock,
          (COALESCE(s.quantity, 0) + COALESCE(w.quantity, 0)) as total_stock
        FROM product_variants pv
        LEFT JOIN inventory_levels s ON s.variant_id = pv.id AND s.location = 'store'
        LEFT JOIN inventory_levels w ON w.variant_id = pv.id AND w.location = 'warehouse'
        WHERE pv.product_id = ? AND pv.is_active = 1
        ORDER BY pv.selling_price ASC
      `).all(prod.id);
      prod.variants = variants;
    }

    return NextResponse.json({ products });
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

    const { category, tamil_name, english_name, description, variants } = await request.json();
    if (!category || !tamil_name) {
      return NextResponse.json({ error: 'Category and Tamil Name are required' }, { status: 400 });
    }

    const db = getDatabase();
    const productId = `prod-${Date.now()}`;

    const createProductTx = db.transaction(() => {
      db.prepare(`
        INSERT INTO products (id, category, tamil_name, english_name, description)
        VALUES (?, ?, ?, ?, ?)
      `).run(productId, category, tamil_name, english_name || null, description || null);

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          const variantId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          const sku = v.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          db.prepare(`
            INSERT INTO product_variants (
              id, product_id, variant_name, sku, unit, cost_price, selling_price, min_stock_level
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(variantId, productId, v.variant_name || 'Standard', sku, v.unit || 'piece', v.cost_price || 0, v.selling_price, v.min_stock_level || 5);

          // Initial stock levels
          db.prepare(`INSERT INTO inventory_levels (id, variant_id, location, quantity) VALUES (?, ?, 'store', ?)`).run(
            `inv-s-${variantId}`, variantId, v.store_stock || 0
          );
          db.prepare(`INSERT INTO inventory_levels (id, variant_id, location, quantity) VALUES (?, ?, 'warehouse', ?)`).run(
            `inv-w-${variantId}`, variantId, v.warehouse_stock || 0
          );
        }
      }
    });

    createProductTx();
    return NextResponse.json({ success: true, productId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
