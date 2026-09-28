import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { AttendanceService } from '@/lib/services/attendance-service';

export async function GET() {
  try {
    const employees = AttendanceService.getEmployees();
    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    const { employee_code, name, phone, role, joining_date, salary_type, salary_rate } = await request.json();

    if (!employee_code || !name || !role) {
      return NextResponse.json({ error: 'Code, name and role are required' }, { status: 400 });
    }

    const db = getDatabase();
    const id = `emp-${Date.now()}`;

    db.prepare(`
      INSERT INTO employees (
        id, employee_code, name, phone, role, joining_date, salary_type, salary_rate
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      employee_code,
      name,
      phone || null,
      role,
      joining_date || new Date().toISOString().slice(0, 10),
      salary_type || 'daily',
      Number(salary_rate) || 0
    );

    return NextResponse.json({ success: true, employeeId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
