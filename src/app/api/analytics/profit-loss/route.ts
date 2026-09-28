import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const today = new Date().toISOString().slice(0, 10);
    const from = searchParams.get('from') || today;
    const to = searchParams.get('to') || today;

    const report = AnalyticsService.getProfitLoss(from, to);
    return NextResponse.json({ report });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
