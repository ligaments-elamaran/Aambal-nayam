import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory-service';

export async function GET() {
  try {
    const transfers = InventoryService.getTransfers(30);
    return NextResponse.json({ transfers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { source, destination, items, notes } = await request.json();

    if (!source || !destination) {
      return NextResponse.json({ error: 'Source and destination locations are required' }, { status: 400 });
    }

    const result = InventoryService.transferStock(
      source,
      destination,
      items,
      user.id,
      notes
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Transfer failed' }, { status: 400 });
  }
}
