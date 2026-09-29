import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getDatabase();

    const { tamil_name, english_name, description, is_active, variants } = body;

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE products
        SET tamil_name = COALESCE(?, tamil_name),
            english_name = COALESCE(?, english_name),
            description = COALESCE(?, description),
            is_active = COALESCE(?, is_active)
        WHERE id = ?
      `).run(tamil_name, english_name, description, is_active, id);

      if (variants && Array.isArray(variants)) {
        for (const v of variants) {
          if (v.id) {
            db.prepare(`
              UPDATE product_variants
              SET variant_name = COALESCE(?, variant_name),
                  sku = COALESCE(?, sku),
                  unit = COALESCE(?, unit),
                  cost_price = COALESCE(?, cost_price),
                  selling_price = COALESCE(?, selling_price),
                  min_stock_level = COALESCE(?, min_stock_level),
                  is_active = COALESCE(?, is_active)
              WHERE id = ?
            `).run(v.variant_name, v.sku, v.unit, v.cost_price, v.selling_price, v.min_stock_level, v.is_active, v.id);
          } else {
            const newVarId = `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
            db.prepare(`
              INSERT INTO product_variants (
                id, product_id, variant_name, sku, unit, cost_price, selling_price, min_stock_level
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(newVarId, id, v.variant_name, v.sku, v.unit, v.cost_price || 0, v.selling_price, v.min_stock_level || 5);
          }
        }
      }
    });

    updateTx();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { id } = await params;
    const db = getDatabase();

    const deleteTx = db.transaction(() => {
      db.prepare(`UPDATE products SET is_active = 0 WHERE id = ?`).run(id);
      db.prepare(`UPDATE product_variants SET is_active = 0 WHERE product_id = ?`).run(id);
    });

    deleteTx();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
