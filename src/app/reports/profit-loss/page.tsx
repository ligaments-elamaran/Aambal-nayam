'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ReceiptIndianRupee, 
  Calendar, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight,
  PieChart
} from 'lucide-react';
import { ProfitLossReport } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function ProfitLossPage() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayOfMonth = `${new Date().toISOString().slice(0, 7)}-01`;

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayStr);
  const [report, setReport] = useState<ProfitLossReport | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/profit-loss?from=${from}&to=${to}`);
      const data = await res.json();
      setReport(data.report);
    } catch (err) {
      console.error('Failed to load P&L statement:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [from, to]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-700" />
            <span>நிதி லாப-நஷ்ட அறிக்கை (Profit & Loss Statement)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            வருவாய், மூலப்பொருள் அடக்க விலை, மொத்த லாபம் மற்றும் நிகர வருவாய் கணக்கீடு
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            />
            <span className="text-slate-400">முதல்</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>அறிக்கையை அச்சிடு (Print)</span>
          </button>
        </div>
      </div>

      {/* Structured P&L Statement Card */}
      {loading ? (
        <div className="bg-white p-12 text-center text-slate-500 text-sm rounded-xl border border-slate-200">
          லாப-நஷ்ட அறிக்கை கணக்கிடப்படுகிறது...
        </div>
      ) : report ? (
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
          {/* Statement Header */}
          <div className="text-center border-b border-slate-200 pb-5">
            <h2 className="text-2xl font-bold text-emerald-950">பாரம்பரிய சுவை தேநீர் அரங்கம்</h2>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-semibold">
              Heritage Tea Stall & Traditional Retail P&L
            </p>
            <p className="text-xs text-emerald-800 font-medium mt-1">
              கால அளவு: {from} முதல் {to} வரை
            </p>
          </div>

          {/* Statement Lines */}
          <div className="space-y-4 text-sm font-medium">
            {/* 1. SALES REVENUE */}
            <div className="space-y-1">
              <div className="flex justify-between items-center py-2 text-slate-900 font-bold border-b border-slate-200">
                <span>(I) மொத்த விற்பனை வருவாய் (Sales Revenue)</span>
                <span className="text-base text-emerald-800">
                  {formatCurrency(report.revenue.sales_total)}
                </span>
              </div>
              <div className="pl-4 flex justify-between text-xs text-slate-500">
                <span>விற்பனை ஆர்டர்கள் எண்ணிக்கை: {report.revenue.sales_count}</span>
                <span>தள்ளுபடி வழங்கியது: {formatCurrency(report.revenue.discounts_given)}</span>
              </div>
            </div>

            {/* 2. COST OF GOODS SOLD (COGS) */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between items-center py-2 text-slate-900 font-bold border-b border-slate-200">
                <span>(II) விற்பனைப் பொருட்களின் அடக்க விலை (Cost of Goods Sold - COGS)</span>
                <span className="text-base text-amber-900">
                  -{formatCurrency(report.cogs.total_cogs)}
                </span>
              </div>
              <div className="pl-4 flex justify-between text-xs text-slate-500">
                <span>விற்கப்பட்ட உணவு மற்றும் எண்ணெய்/அரிசி மூலப்பொருள் அடக்கம்</span>
              </div>
            </div>

            {/* 3. GROSS PROFIT */}
            <div className="bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 flex justify-between items-center font-bold">
              <div>
                <div className="text-emerald-950 text-sm">
                  (=) மொத்த லாபம் (Gross Profit = Revenue - COGS)
                </div>
                <div className="text-[11px] text-emerald-700 font-normal">
                  Gross Margin: {report.cogs.gross_margin_percent}%
                </div>
              </div>
              <div className="text-lg text-emerald-900">
                {formatCurrency(report.gross_profit)}
              </div>
            </div>

            {/* 4. OPERATING EXPENSES */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center py-2 text-slate-900 font-bold border-b border-slate-200">
                <span>(III) வணிக செயல்பாட்டு செலவுகள் (Operating Expenses)</span>
                <span className="text-base text-red-600">
                  -{formatCurrency(report.expenses.total_expenses)}
                </span>
              </div>

              {/* Expense by Category Breakdown */}
              <div className="pl-4 space-y-1.5 pt-1">
                {report.expenses.by_category.map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                      <span>{cat.category_name}</span>
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(cat.amount)} ({cat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. NET PROFIT */}
            <div className="mt-6 p-5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex justify-between items-center shadow-lg">
              <div>
                <div className="text-xs uppercase tracking-wider text-emerald-200 font-bold">
                  நிகர லாபம் / நஷ்டம் (Net Profit)
                </div>
                <div className="text-xs text-amber-200 mt-0.5">
                  Gross Profit - Total Expenses &bull; Margin: {report.net_margin_percent}%
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold ${
                report.net_profit >= 0 ? 'text-amber-300' : 'text-red-300'
              }`}>
                {formatCurrency(report.net_profit)}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
