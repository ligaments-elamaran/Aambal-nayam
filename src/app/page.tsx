'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  ReceiptIndianRupee, 
  DollarSign, 
  Boxes, 
  Users, 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/dashboard?period=${selectedPeriod}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to fetch dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const pl = data?.pl;

  return (
    <div className="space-y-6">
      {/* Top Bar with Period Filter & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>வணிக டாஷ்போர்டு (Executive Overview)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            நிகழ்நேர விற்பனை, சரக்கு இருப்பு மற்றும் நிதி நிலைமை
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: 'today', label: 'இன்று (Today)' },
              { id: 'week', label: '7 நாட்கள் (Week)' },
              { id: 'month', label: 'மாதம் (Month)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  period === tab.id
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>புதிய விற்பனை (POS)</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                விற்பனை வருவாய் (Sales)
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(pl?.revenue?.sales_total || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            <span className="font-semibold text-slate-700 mr-1.5">
              {pl?.revenue?.sales_count || 0}
            </span>
            <span>ஆர்டர்கள் / பில்கள் ({period})</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                செயல்பாட்டு செலவுகள் (Expenses)
              </p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(pl?.expenses?.total_expenses || 0)}
              </h3>
            </div>
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <ReceiptIndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-slate-500">
            <span className="text-slate-500">பால், சிலிண்டர் & பராமரிப்பு</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                நிகர லாபம் (Net Profit)
              </p>
              <h3 className={`text-2xl font-bold mt-1 ${
                (pl?.net_profit || 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
              }`}>
                {formatCurrency(pl?.net_profit || 0)}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${
              (pl?.net_profit || 0) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
            }`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs">
            <span className="font-bold mr-1 text-slate-700">
              {pl?.net_margin_percent || 0}%
            </span>
            <span className="text-slate-500">நிகர லாப சதவிகிதம் (Margin)</span>
          </div>
        </div>

        {/* Inventory & Active Staff */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                செயலில் உள்ள ஊழியர்கள்
              </p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">
                {data?.activeStaffCount || 0} <span className="text-sm font-normal text-slate-500">/ 4 நபர்கள்</span>
              </h3>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{data?.lowStockCount || 0} பொருட்கள் குறைவு</span>
            </span>
            <Link href="/inventory" className="text-emerald-700 hover:underline">
              விவரம் &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Middle Section: P&L Summary Bar & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L Flow Breakdown */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>லாப நஷ்ட கணக்கீட்டு சுருக்கம் (P&L Breakdown)</span>
            </h3>
            <Link
              href="/reports/profit-loss"
              className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1"
            >
              <span>முழு அறிக்கை (Full Statement)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3 pt-2">
            {/* Revenue */}
            <div className="flex items-center justify-between p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 text-xs">
              <span className="font-semibold text-emerald-950">(+) மொத்த விற்பனை வருவாய் (Sales Revenue)</span>
              <span className="font-bold text-emerald-900 text-sm">{formatCurrency(pl?.revenue?.sales_total || 0)}</span>
            </div>

            {/* COGS */}
            <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-lg border border-amber-100 text-xs">
              <span className="font-semibold text-amber-950">(-) மூலப்பொருள் அடக்க விலை (COGS)</span>
              <span className="font-bold text-amber-900 text-sm">-{formatCurrency(pl?.cogs?.total_cogs || 0)}</span>
            </div>

            {/* Gross Profit */}
            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg text-xs font-bold text-slate-800">
              <span>(=) மொத்த லாபம் (Gross Profit)</span>
              <span className="text-sm">{formatCurrency(pl?.gross_profit || 0)}</span>
            </div>

            {/* Expenses */}
            <div className="flex items-center justify-between p-3 bg-red-50/60 rounded-lg border border-red-100 text-xs">
              <span className="font-semibold text-red-950">(-) செயல்பாட்டு செலவுகள் (Operating Expenses)</span>
              <span className="font-bold text-red-900 text-sm">-{formatCurrency(pl?.expenses?.total_expenses || 0)}</span>
            </div>

            {/* Net Profit */}
            <div className="flex items-center justify-between p-4 bg-emerald-800 text-white rounded-xl text-sm font-extrabold shadow-sm">
              <span>நிகர லாபம் (Net Profit)</span>
              <span className="text-lg text-amber-300">{formatCurrency(pl?.net_profit || 0)}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>குறைந்த இருப்பு எச்சரிக்கை (Low Stock)</span>
              </h3>
              <Link
                href="/inventory"
                className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold"
              >
                பரிமாற்றம் &rarr;
              </Link>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-64 pr-1">
              {data?.lowStockItems?.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  அனைத்து பொருட்களும் போதிய அளவில் கையிருப்பில் உள்ளன.
                </div>
              ) : (
                data?.lowStockItems?.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-amber-50/60 rounded-lg border border-amber-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">{item.tamil_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.variant_name} &bull; {item.location === 'store' ? 'கடை (Store)' : 'கிடங்கு (Warehouse)'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-900">
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">குறைந்தபட்சம்: {item.min_stock_level}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 mt-4">
            <Link
              href="/inventory"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>கிடங்கிலிருந்து கடைக்கு மாற்றுக (Transfer Stock)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Top Selling Products & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-3">
            அதிக விற்பனையான பாரம்பரிய பொருட்கள் (Top Selling Items)
          </h3>
          <div className="divide-y divide-slate-100">
            {data?.topProducts?.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                இன்னும் விற்பனை பதிவுகள் இல்லை.
              </div>
            ) : (
              data?.topProducts?.map((prod: any, idx: number) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-slate-800">{prod.product_name}</div>
                      <div className="text-[10px] text-slate-500">{prod.variant_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">{formatCurrency(prod.total_revenue)}</div>
                    <div className="text-[10px] text-slate-500">{prod.total_qty} விற்றுள்ளது</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Operations Shortcuts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm mb-3">
              விரைவு நிர்வாக வழிகள் (Management Shortcuts)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Link
                href="/attendance"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition flex flex-col gap-1"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>ஊழியர் வருகை</span>
                </div>
                <p className="text-[11px] text-slate-500">இன்/அவுட் நேரம் & ஓவர்டைம் பதிவு</p>
              </Link>

              <Link
                href="/expenses"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition flex flex-col gap-1"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ReceiptIndianRupee className="w-4 h-4 text-emerald-700" />
                  <span>செலவு பற்று</span>
                </div>
                <p className="text-[11px] text-slate-500">பால், கேஸ் & கூலி செலவுகள்</p>
              </Link>

              <Link
                href="/inventory"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition flex flex-col gap-1"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-emerald-700" />
                  <span>சரக்கு இருப்பு</span>
                </div>
                <p className="text-[11px] text-slate-500">கிடங்கு vs கடை கையிருப்பு</p>
              </Link>

              <Link
                href="/menu"
                className="p-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition flex flex-col gap-1"
              >
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>மெனு & விலைகள்</span>
                </div>
                <p className="text-[11px] text-slate-500">எண்ணெய் & அரிசி பேக்கேஜ் SKUs</p>
              </Link>
            </div>
          </div>

          <div className="p-3 bg-emerald-900 text-white rounded-xl text-xs mt-4 flex items-center justify-between">
            <div>
              <div className="font-bold">பாதுகாப்பான தரவுத்தளம் (WAL Mode)</div>
              <div className="text-[10px] text-emerald-200">அனைத்து விற்பனை மற்றும் பரிமாற்றங்களும் உடனடி கணக்கில் பதியப்படும்</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
