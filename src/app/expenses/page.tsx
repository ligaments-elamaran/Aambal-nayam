'use client';

import React, { useState, useEffect } from 'react';
import { ReceiptIndianRupee, Plus, Calendar, Filter, X } from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // New Expense Modal
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().slice(0, 10),
    category_id: '',
    description: '',
    amount: '',
    payment_method: 'cash',
    vendor_person: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const url = selectedCategory !== 'all' ? `/api/expenses?category_id=${selectedCategory}` : '/api/expenses';
      const res = await fetch(url);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setCategories(data.categories || []);
      setTotal(data.total || 0);
      if (!formData.category_id && data.categories?.length > 0) {
        setFormData((prev) => ({ ...prev, category_id: data.categories[0].id }));
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record expense');
      }

      setShowModal(false);
      setFormData({
        expense_date: new Date().toISOString().slice(0, 10),
        category_id: categories[0]?.id || '',
        description: '',
        amount: '',
        payment_method: 'cash',
        vendor_person: '',
        notes: '',
      });
      loadExpenses();
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
            <ReceiptIndianRupee className="w-5 h-5 text-red-600" />
            <span>தினசரி செலவுகள் பதிவேடு (Operating Expenses)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            பால், மூலப்பொருட்கள், எரிவாயு, வாடகை மற்றும் இதர செலவுகள்
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>புதிய செலவு பதிவு (Add Expense)</span>
        </button>
      </div>

      {/* Filter and Stat Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">பிரிவு (Category):</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="all">அனைத்து செலவுகளும் (All Categories)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-xs text-red-800 font-semibold">மொத்த செலவுத் தொகை (Total Expenses):</span>
          <span className="text-lg font-bold text-red-700">{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">செலவு விவரங்கள் ஏற்றப்படுகின்றன...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">தேதி (Date)</th>
                  <th className="p-3">செலவு வகை (Category)</th>
                  <th className="p-3">விவரம் (Description)</th>
                  <th className="p-3">விற்பனையாளர் / நபர்</th>
                  <th className="p-3">முறை (Method)</th>
                  <th className="p-3 text-right">தொகை (Amount)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      செலவு பதிவுகள் ஏதும் இல்லை.
                    </td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-800">{formatDate(exp.expense_date)}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-full font-medium">
                          {exp.category_name}
                        </span>
                      </td>
                      <td className="p-3 text-slate-900 font-medium">{exp.description}</td>
                      <td className="p-3 text-slate-500">{exp.vendor_person || '-'}</td>
                      <td className="p-3">
                        <span className="uppercase text-[10px] font-bold text-slate-600">
                          {exp.payment_method}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-red-600 text-sm">
                        {formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add Expense */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-red-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-200" />
                <h3 className="font-bold text-base">புதிய செலவு பதிவு (Record Expense)</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-red-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">தேதி (Date)</label>
                  <input
                    type="date"
                    required
                    value={formData.expense_date}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">தொகை (Amount ₹)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">செலவு வகை (Category)</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">விவரம் (Description)</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="எ.கா: காலை பசும்பால் 30 லிட்டர்"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">விற்பனையாளர் / வாங்கிய நபர்</label>
                  <input
                    type="text"
                    value={formData.vendor_person}
                    onChange={(e) => setFormData({ ...formData, vendor_person: e.target.value })}
                    placeholder="எ.கா: ஆவின் / ராஜேந்திரன்"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">பணம் செலுத்திய முறை</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="cash">ரொக்கம் (Cash)</option>
                    <option value="upi">UPI / GPay</option>
                    <option value="card">கார்டு (Card)</option>
                    <option value="bank_transfer">வங்கி பரிமாற்றம்</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {submitting ? 'பதிவாகிறது...' : 'செலவை பதிவு செய் (Save Expense)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
