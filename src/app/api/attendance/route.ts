import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AttendanceService } from '@/lib/services/attendance-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const month = searchParams.get('month') || undefined;

    const records = AttendanceService.getAttendance(date, month);
    return NextResponse.json({ attendance: records });
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

    const body = await request.json();
    if (!body.employee_id || !body.date) {
      return NextResponse.json({ error: 'Employee ID and Date are required' }, { status: 400 });
    }

    const record = AttendanceService.recordAttendance(body);
    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
