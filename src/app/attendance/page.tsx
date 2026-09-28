'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckCircle2, UserCheck, AlertCircle, X } from 'lucide-react';
import { Employee, AttendanceRecord } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);

  // Clock In/Out Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [checkInTime, setCheckInTime] = useState('06:00');
  const [checkOutTime, setCheckOutTime] = useState('15:00');
  const [breakMins, setBreakMins] = useState('30');
  const [status, setStatus] = useState<'present' | 'late' | 'half_day' | 'absent' | 'on_leave'>('present');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        fetch('/api/employees'),
        fetch(`/api/attendance?date=${selectedDate}`),
      ]);
      const empData = await empRes.json();
      const attData = await attRes.json();

      setEmployees(empData.employees || []);
      setAttendance(attData.attendance || []);
    } catch (err) {
      console.error('Failed to load attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const openLogModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    const existing = attendance.find((a) => a.employee_id === emp.id);
    if (existing) {
      setCheckInTime(existing.check_in || '06:00');
      setCheckOutTime(existing.check_out || '15:00');
      setBreakMins(existing.break_minutes?.toString() || '30');
      setStatus(existing.status);
      setNotes(existing.notes || '');
    } else {
      setCheckInTime('06:00');
      setCheckOutTime('');
      setBreakMins('30');
      setStatus('present');
      setNotes('');
    }
    setShowModal(true);
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          date: selectedDate,
          check_in: checkInTime || null,
          check_out: checkOutTime || null,
          break_minutes: Number(breakMins) || 0,
          status,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save attendance');
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <span>ஊழியர் பணி வருகை & ஓவர்டைம் (Attendance & Hours)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            முருகன், செல்வன், அனிதா, பிரகாஷ் - தினசரி பணி நேரம், இடைவேளை & கூடுதல் நேரம்
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Employees Register Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {employees.map((emp) => {
          const record = attendance.find((a) => a.employee_id === emp.id);
          const isPresent = record && record.status === 'present';
          const isLate = record && record.status === 'late';
          const isCheckedIn = record && record.check_in;
          const isCheckedOut = record && record.check_out;

          return (
            <div
              key={emp.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 font-bold">
                      {emp.employee_code}
                    </span>
                    <h3 className="font-bold text-slate-800 text-sm mt-0.5">{emp.name}</h3>
                    <p className="text-xs text-emerald-700 font-medium">{emp.role}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      record
                        ? isPresent
                          ? 'bg-emerald-100 text-emerald-800'
                          : isLate
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {record ? record.status.toUpperCase() : 'NOT MARKED'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>உள்நுழைவு (In):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record?.check_in || '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>வெளியேறு (Out):</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {record?.check_out || '--:--'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>பணி நேரம் (Hours):</span>
                    <span className="font-bold text-emerald-800">
                      {record?.working_hours ? `${record.working_hours} மணி` : '0'}
                    </span>
                  </div>
                  {record && record.overtime_hours > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>கூடுதல் நேரம் (OT):</span>
                      <span>+{record.overtime_hours} மணி</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openLogModal(emp)}
                  className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{record ? 'நேரத்தை திருத்து (Edit)' : 'வருகை பதிவு (Mark)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Monthly Work Summary Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">
          மாதாந்திர பணி சுருக்கம் (Monthly Working Stats)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase">
              <tr>
                <th className="p-3">குறியீடு</th>
                <th className="p-3">பெயர் (Staff Name)</th>
                <th className="p-3">பொறுப்பு (Designation)</th>
                <th className="p-3">சம்பள முறை</th>
                <th className="p-3 text-right">வந்த நாட்கள்</th>
                <th className="p-3 text-right">மொத்த பணி மணிநேரம்</th>
                <th className="p-3 text-right">கூடுதல் நேரம் (OT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-500">{emp.employee_code}</td>
                  <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                  <td className="p-3 text-slate-600">{emp.role}</td>
                  <td className="p-3 capitalize">{emp.salary_type} (₹{emp.salary_rate})</td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    {emp.total_present_days || 0} நாட்கள்
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-800">
                    {emp.total_working_hours || 0} மணி
                  </td>
                  <td className="p-3 text-right font-semibold text-amber-700">
                    {emp.total_overtime_hours || 0} மணி
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Check-In / Out & Hours Editor */}
      {showModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">{selectedEmployee.name}</h3>
                  <p className="text-[11px] text-emerald-200">{selectedEmployee.role}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAttendance} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">நிலை (Status)</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="present">வந்தார் (Present)</option>
                  <option value="late">தாமதம் (Late)</option>
                  <option value="half_day">அரை நாள் (Half Day)</option>
                  <option value="absent">வரவில்லை (Absent)</option>
                  <option value="on_leave">விடுப்பு (On Leave)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">உள்நுழைவு நேரம் (In)</label>
                  <input
                    type="time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">வெளியேறும் நேரம் (Out)</label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">இடைவேளை (Break Minutes)</label>
                <input
                  type="number"
                  value={breakMins}
                  onChange={(e) => setBreakMins(e.target.value)}
                  placeholder="30"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">குறிப்புகள் (Notes)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="எ.கா: காலை தேநீர் தயாரிப்பு பணி"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {submitting ? 'பதிவாகிறது...' : 'வருகையை உறுதி செய் (Save Attendance)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
