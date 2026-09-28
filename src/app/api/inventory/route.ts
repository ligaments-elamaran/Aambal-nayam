import { NextResponse } from 'next/server';
import { InventoryService } from '@/lib/services/inventory-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = (searchParams.get('location') as 'store' | 'warehouse') || undefined;
    const lowStock = searchParams.get('low_stock') === 'true';

    const stock = InventoryService.getStockLevels(location, lowStock);
    return NextResponse.json({ stock });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
