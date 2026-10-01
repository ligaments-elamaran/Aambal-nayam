import { getDatabase } from '../db';
import { AttendanceRecord, Employee } from '@/types';

export class AttendanceService {
  /**
   * List all employees with monthly statistics
   */
  static getEmployees(): Employee[] {
    const db = getDatabase();
    const employees = db.prepare(`
      SELECT * FROM employees ORDER BY employee_code ASC
    `).all() as Employee[];

    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    for (const emp of employees) {
      const stats = db.prepare(`
        SELECT 
          COUNT(CASE WHEN status IN ('present', 'late', 'half_day') THEN 1 END) as total_present,
          SUM(working_hours) as total_hours,
          SUM(overtime_hours) as total_ot
        FROM attendance
        WHERE employee_id = ? AND date LIKE ?
      `).get(emp.id, `${currentMonth}%`) as { total_present: number; total_hours: number; total_ot: number };

      emp.total_present_days = stats.total_present || 0;
      emp.total_working_hours = Number((stats.total_hours || 0).toFixed(2));
      emp.total_overtime_hours = Number((stats.total_ot || 0).toFixed(2));

      if (emp.salary_type === 'hourly') {
        emp.estimated_pay = Number((emp.total_working_hours * emp.salary_rate).toFixed(2));
      } else if (emp.salary_type === 'daily') {
        emp.estimated_pay = Number((emp.total_present_days * emp.salary_rate).toFixed(2));
      } else {
        emp.estimated_pay = emp.salary_rate;
      }
    }

    return employees;
  }

  /**
   * Get attendance records for a specific date or month
   */
  static getAttendance(date?: string, month?: string): AttendanceRecord[] {
    const db = getDatabase();
    let query = `
      SELECT 
        a.*,
        e.name as employee_name,
        e.employee_code,
        e.role as employee_role
      FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (date) {
      query += ` AND a.date = ?`;
      params.push(date);
    } else if (month) {
      query += ` AND a.date LIKE ?`;
      params.push(`${month}%`);
    }

    query += ` ORDER BY a.date DESC, e.employee_code ASC`;

    return db.prepare(query).all(...params) as AttendanceRecord[];
  }

  /**
   * Update employee profile and salary details
   */
  static updateEmployee(id: string, data: {
    name?: string;
    phone?: string | null;
    role?: string;
    salary_type?: 'monthly' | 'daily' | 'hourly';
    salary_rate?: number;
    is_active?: number;
  }): Employee {
    const db = getDatabase();

    db.prepare(`
      UPDATE employees
      SET name = COALESCE(?, name),
          phone = COALESCE(?, phone),
          role = COALESCE(?, role),
          salary_type = COALESCE(?, salary_type),
          salary_rate = COALESCE(?, salary_rate),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      data.name ?? null,
      data.phone ?? null,
      data.role ?? null,
      data.salary_type ?? null,
      data.salary_rate ?? null,
      data.is_active ?? null,
      id
    );

    return db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as Employee;
  }

  /**
   * Log or update attendance record (Check-in, Check-out, Break)
   * Working hours = (Check-out - Check-in in minutes - Break) / 60
   * Overtime = Max(0, Working Hours - Standard 8 hours)
   */
  static recordAttendance(data: {
    employee_id: string;
    date: string;
    check_in?: string | null;
    check_out?: string | null;
    break_minutes?: number;
    status?: 'present' | 'late' | 'half_day' | 'absent' | 'on_leave';
    notes?: string;
  }): AttendanceRecord {
    const db = getDatabase();
    const breakMins = data.break_minutes || 0;

    let workingHours = 0;
    let overtimeHours = 0;

    if (data.check_in && data.check_out) {
      const [inH, inM] = data.check_in.split(':').map(Number);
      const [outH, outM] = data.check_out.split(':').map(Number);

      const totalMins = (outH * 60 + outM) - (inH * 60 + inM) - breakMins;
      if (totalMins > 0) {
        workingHours = Number((totalMins / 60).toFixed(2));
        if (workingHours > 8) {
          overtimeHours = Number((workingHours - 8).toFixed(2));
        }
      }
    }

    const defaultStatus = data.status || (data.check_in ? 'present' : 'absent');

    const existing = db.prepare(`
      SELECT id FROM attendance WHERE employee_id = ? AND date = ?
    `).get(data.employee_id, data.date) as { id: string } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE attendance 
        SET check_in = COALESCE(?, check_in),
            check_out = COALESCE(?, check_out),
            break_minutes = ?,
            working_hours = ?,
            overtime_hours = ?,
            status = ?,
            notes = COALESCE(?, notes)
        WHERE id = ?
      `).run(
        data.check_in ?? null,
        data.check_out ?? null,
        breakMins,
        workingHours,
        overtimeHours,
        defaultStatus,
        data.notes ?? null,
        existing.id
      );
      return db.prepare('SELECT * FROM attendance WHERE id = ?').get(existing.id) as AttendanceRecord;
    } else {
      const newId = `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      db.prepare(`
        INSERT INTO attendance (
          id, employee_id, date, check_in, check_out, break_minutes,
          working_hours, overtime_hours, status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newId,
        data.employee_id,
        data.date,
        data.check_in || null,
        data.check_out || null,
        breakMins,
        workingHours,
        overtimeHours,
        defaultStatus,
        data.notes || null
      );
      return db.prepare('SELECT * FROM attendance WHERE id = ?').get(newId) as AttendanceRecord;
    }
  }
}
