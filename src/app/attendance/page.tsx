'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, Calendar, CheckCircle2, UserCheck, AlertCircle, X, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Employee, AttendanceRecord } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';

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

  // Edit Employee Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    role: '',
    salary_type: 'daily' as 'monthly' | 'daily' | 'hourly',
    salary_rate: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    employee_code: '',
    name: '',
    phone: '',
    role: '',
    joining_date: new Date().toISOString().slice(0, 10),
    salary_type: 'daily' as 'monthly' | 'daily' | 'hourly',
    salary_rate: '',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');

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

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditForm({
      name: emp.name,
      phone: emp.phone || '',
      role: emp.role,
      salary_type: emp.salary_type,
      salary_rate: emp.salary_rate.toString(),
    });
    setEditError('');
    setShowModal(false);
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          phone: editForm.phone || null,
          role: editForm.role,
          salary_type: editForm.salary_type,
          salary_rate: Number(editForm.salary_rate) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update employee');
      }

      setEditingEmployee(null);
      loadData();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/employees/${deletingEmployee.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete employee');
      }
      setDeletingEmployee(null);
      loadData();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddError('');

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_code: addForm.employee_code,
          name: addForm.name,
          phone: addForm.phone || undefined,
          role: addForm.role,
          joining_date: addForm.joining_date,
          salary_type: addForm.salary_type,
          salary_rate: Number(addForm.salary_rate) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add employee');
      }

      setShowAddModal(false);
      setAddForm({
        employee_code: '',
        name: '',
        phone: '',
        role: '',
        joining_date: new Date().toISOString().slice(0, 10),
        salary_type: 'daily',
        salary_rate: '',
      });
      loadData();
    } catch (err: any) {
      setAddError(err.message);
    } finally {
      setAddSubmitting(false);
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
          <button
            onClick={() => { setShowAddModal(true); setAddError(''); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>புதிய ஊழியர் (Add Employee)</span>
          </button>
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

              <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                <button
                  onClick={() => openLogModal(emp)}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{record ? 'நேரத்தை திருத்து (Edit)' : 'வருகை பதிவு (Mark)'}</span>
                </button>
                <button
                  onClick={() => openEditModal(emp)}
                  title="Edit Employee Profile & Salary"
                  className="py-1.5 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-300 rounded-lg text-xs transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setDeletingEmployee(emp); setDeleteError(''); }}
                  title="Delete Employee"
                  className="py-1.5 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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
                <th className="p-3 text-right">மதிப்பிடப்பட்ட சம்பளம் (Est. Pay)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-500">{emp.employee_code}</td>
                  <td className="p-3 font-bold text-slate-900">{emp.name}</td>
                  <td className="p-3 text-slate-600">{emp.role}</td>
                  <td className="p-3 capitalize">
                    {emp.salary_type} (₹{emp.salary_rate}{emp.salary_type === 'hourly' ? '/hr' : ''})
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">
                    {emp.total_present_days || 0} நாட்கள்
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-800">
                    {emp.total_working_hours || 0} மணி
                  </td>
                  <td className="p-3 text-right font-semibold text-amber-700">
                    {emp.total_overtime_hours || 0} மணி
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-800">
                    {formatCurrency(emp.estimated_pay || 0)}
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

      {/* MODAL: Edit Employee Profile & Salary */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">ஊழியர் விவரம் திருத்து (Edit Employee)</h3>
                  <p className="text-[11px] text-emerald-200">{editingEmployee.employee_code}</p>
                </div>
              </div>
              <button onClick={() => setEditingEmployee(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {editError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">பெயர் (Name)</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">பொறுப்பு (Role)</label>
                  <input
                    type="text"
                    required
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">தொலைபேசி (Phone)</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">சம்பள முறை (Salary Type)</label>
                  <select
                    value={editForm.salary_type}
                    onChange={(e) => setEditForm({ ...editForm, salary_type: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="monthly">மாதாந்திரம் (Monthly)</option>
                    <option value="daily">தினசரி (Daily)</option>
                    <option value="hourly">மணி நேர அடிப்படையில் (Hourly)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    சம்பள விகிதம் (₹)
                    {editForm.salary_type === 'hourly' && ' / hour'}
                    {editForm.salary_type === 'daily' && ' / day'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editForm.salary_rate}
                    onChange={(e) => setEditForm({ ...editForm, salary_rate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {editForm.salary_type === 'hourly' && (
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
                  மணி நேர ஊதியம்: இந்த மாதம் பதிவான மொத்த பணி மணிநேரம் &times; விகிதம் = மதிப்பிடப்பட்ட சம்பளம்.
                  (Hourly pay: total recorded working hours this month &times; rate = estimated salary, shown in the summary table below.)
                </p>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {editSubmitting ? 'சேமிக்கப்படுகிறது...' : 'மாற்றங்களை சேமி (Save Changes)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Employee Confirmation */}
      {deletingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-base">ஊழியரை நீக்கு (Delete Employee)</h3>
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-bold">{deletingEmployee.name}</span> ({deletingEmployee.employee_code}) ஐ நீக்க வேண்டுமா? இவர் பட்டியலில் இருந்து மறைக்கப்படுவார். கடந்த வருகை மற்றும் சம்பள பதிவுகள் பாதுகாக்கப்படும். (This will hide them from the active roster. Past attendance and pay records are kept.)
              </p>
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeletingEmployee(null)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-xs"
                >
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  disabled={deleting}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition text-xs disabled:opacity-50"
                >
                  {deleting ? 'நீக்கப்படுகிறது...' : 'நீக்கு (Delete)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">புதிய ஊழியர் சேர் (Add Employee)</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4 text-xs">
              {addError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {addError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">குறியீடு (Employee Code)</label>
                  <input
                    type="text"
                    required
                    value={addForm.employee_code}
                    onChange={(e) => setAddForm({ ...addForm, employee_code: e.target.value })}
                    placeholder="EMP005"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">சேர்ந்த தேதி (Joining Date)</label>
                  <input
                    type="date"
                    required
                    value={addForm.joining_date}
                    onChange={(e) => setAddForm({ ...addForm, joining_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">பெயர் (Name)</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">பொறுப்பு (Role)</label>
                  <input
                    type="text"
                    required
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    placeholder="Tea Master"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">தொலைபேசி (Phone)</label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">சம்பள முறை (Salary Type)</label>
                  <select
                    value={addForm.salary_type}
                    onChange={(e) => setAddForm({ ...addForm, salary_type: e.target.value as any })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="monthly">மாதாந்திரம் (Monthly)</option>
                    <option value="daily">தினசரி (Daily)</option>
                    <option value="hourly">மணி நேர அடிப்படையில் (Hourly)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    சம்பள விகிதம் (₹)
                    {addForm.salary_type === 'hourly' && ' / hour'}
                    {addForm.salary_type === 'daily' && ' / day'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={addForm.salary_rate}
                    onChange={(e) => setAddForm({ ...addForm, salary_rate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={addSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {addSubmitting ? 'சேமிக்கப்படுகிறது...' : 'ஊழியரை சேமி (Save Employee)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
