import { NextResponse } from 'next/server';
import { POSService } from '@/lib/services/pos-service';

export async function GET() {
  try {
    const catalog = POSService.getCatalog();
    return NextResponse.json({ items: catalog });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
