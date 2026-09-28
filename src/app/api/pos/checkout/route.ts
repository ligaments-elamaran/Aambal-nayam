import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { POSService } from '@/lib/services/pos-service';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { items, payment_method, discount, notes } = await request.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    const result = POSService.checkout(
      user.id,
      items,
      payment_method || 'cash',
      Number(discount) || 0,
      notes
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 400 });
  }
}
