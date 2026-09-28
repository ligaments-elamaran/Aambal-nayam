import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory-service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { variant_id, location, quantity, type, reason } = await request.json();

    if (!variant_id || !location || quantity === undefined) {
      return NextResponse.json({ error: 'Variant, location and quantity are required' }, { status: 400 });
    }

    InventoryService.adjustStock(
      variant_id,
      location,
      Number(quantity),
      type || 'adjustment',
      reason || 'Manual adjustment',
      user.id
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Stock adjustment failed' }, { status: 400 });
  }
}
