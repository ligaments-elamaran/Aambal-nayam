import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/services/analytics-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as 'today' | 'week' | 'month') || 'today';

    const metrics = AnalyticsService.getDashboardMetrics(period);
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
