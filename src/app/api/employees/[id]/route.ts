import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AttendanceService } from '@/lib/services/attendance-service';

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

    const { name, phone, role, salary_type, salary_rate, is_active } = body;

    if (salary_type && !['monthly', 'daily', 'hourly'].includes(salary_type)) {
      return NextResponse.json({ error: 'Invalid salary_type' }, { status: 400 });
    }

    const employee = AttendanceService.updateEmployee(id, {
      name,
      phone,
      role,
      salary_type,
      salary_rate: salary_rate !== undefined ? Number(salary_rate) : undefined,
      is_active,
    });

    return NextResponse.json({ success: true, employee });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
