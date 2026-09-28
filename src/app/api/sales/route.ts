import { NextResponse } from 'next/server';
import { POSService } from '@/lib/services/pos-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const paymentMethod = searchParams.get('payment_method') || undefined;
    const limit = Number(searchParams.get('limit')) || 50;

    const sales = POSService.getSales(from, to, paymentMethod, limit);
    return NextResponse.json({ sales });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
