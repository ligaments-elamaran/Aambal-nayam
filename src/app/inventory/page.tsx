'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  ArrowRightLeft,
  AlertTriangle,
  Plus,
  Search,
  X,
  CheckCircle2,
  Warehouse,
  Store,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { InventoryLevel, StockTransfer } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'store' | 'warehouse' | 'transfers' | 'low_stock'>('store');
  const [stock, setStock] = useState<InventoryLevel[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferSource, setTransferSource] = useState<'warehouse' | 'store'>('warehouse');
  const [transferDest, setTransferDest] = useState<'warehouse' | 'store'>('store');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferError, setTransferError] = useState('');

  // Wastage / Damage modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjVariantId, setAdjVariantId] = useState('');
  const [adjLocation, setAdjLocation] = useState<'store' | 'warehouse'>('store');
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjType, setAdjType] = useState<'damage' | 'wastage' | 'adjustment'>('wastage');
  const [adjReason, setAdjReason] = useState('');
  const [adjSubmitting, setAdjSubmitting] = useState(false);
  const [adjError, setAdjError] = useState('');

  // Edit stock row modal (quantity + min stock level)
  const [editingItem, setEditingItem] = useState<InventoryLevel | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editMinStock, setEditMinStock] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete (deactivate) variant confirmation
  const [deletingItem, setDeletingItem] = useState<InventoryLevel | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadStockData = async () => {
    setLoading(true);
    try {
      let locationQuery = '';
      if (activeTab === 'store') locationQuery = 'location=store';
      else if (activeTab === 'warehouse') locationQuery = 'location=warehouse';
      else if (activeTab === 'low_stock') locationQuery = 'low_stock=true';

      if (activeTab === 'transfers') {
        const res = await fetch('/api/inventory/transfer');
        const data = await res.json();
        setTransfers(data.transfers || []);
      } else {
        const res = await fetch(`/api/inventory?${locationQuery}`);
        const data = await res.json();
        setStock(data.stock || []);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData();
  }, [activeTab]);

  // Execute transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantId || !transferQty) return;
    setTransferSubmitting(true);
    setTransferError('');

    try {
      const res = await fetch('/api/inventory/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: transferSource,
          destination: transferDest,
          items: [{ variant_id: selectedVariantId, quantity: Number(transferQty) }],
          notes: transferNotes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      setShowTransferModal(false);
      setSelectedVariantId('');
      setTransferQty('');
      setTransferNotes('');
      loadStockData();
    } catch (err: any) {
      setTransferError(err.message);
    } finally {
      setTransferSubmitting(false);
    }
  };

  // Execute adjustment/wastage
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjVariantId || !adjQuantity) return;
    setAdjSubmitting(true);
    setAdjError('');

    try {
      const qtyNum = Number(adjQuantity);
      // For damage/wastage, deduction is negative
      const adjustedQty = adjType === 'adjustment' ? qtyNum : -Math.abs(qtyNum);

      const res = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: adjVariantId,
          location: adjLocation,
          quantity: adjustedQty,
          type: adjType,
          reason: adjReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Adjustment failed');
      }

      setShowAdjustmentModal(false);
      setAdjVariantId('');
      setAdjQuantity('');
      setAdjReason('');
      loadStockData();
    } catch (err: any) {
      setAdjError(err.message);
    } finally {
      setAdjSubmitting(false);
    }
  };

  const openEditModal = (item: InventoryLevel) => {
    setEditingItem(item);
    setEditQuantity(item.quantity.toString());
    setEditMinStock((item.min_stock_level ?? 5).toString());
    setEditError('');
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      const newQty = Number(editQuantity);
      const newMinStock = Number(editMinStock);
      const delta = newQty - editingItem.quantity;

      if (delta !== 0) {
        const res = await fetch('/api/inventory/adjustment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variant_id: editingItem.variant_id,
            location: editingItem.location,
            quantity: delta,
            type: 'adjustment',
            reason: 'Manual stock count correction (Inventory edit)',
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update quantity');
      }

      if (newMinStock !== editingItem.min_stock_level && editingItem.product_id) {
        const res = await fetch(`/api/products/${editingItem.product_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variants: [{ id: editingItem.variant_id, min_stock_level: newMinStock }],
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update minimum stock level');
      }

      setEditingItem(null);
      loadStockData();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !deletingItem.product_id) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/products/${deletingItem.product_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: [{ id: deletingItem.variant_id, is_active: 0 }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');

      setDeletingItem(null);
      loadStockData();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredStock = stock.filter((item) => {
    const term = search.toLowerCase();
    return (
      (item.product_name_tamil && item.product_name_tamil.toLowerCase().includes(term)) ||
      (item.product_name_english && item.product_name_english.toLowerCase().includes(term)) ||
      (item.variant_name && item.variant_name.toLowerCase().includes(term)) ||
      (item.sku && item.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-700" />
            <span>இருப்பிடம் சார்ந்த சரக்கு இருப்பு (Multi-location Inventory)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            கடை (Store) மற்றும் மொத்த கிடங்கு (Warehouse) சரக்கு மேலாண்மை
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>சரக்கு பரிமாற்றம் (Transfer)</span>
          </button>

          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>சேதாரம் / கழிவு பதிவு (Wastage)</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          {[
            { id: 'store', label: 'கடை இருப்பு (Store Stock)', icon: Store },
            { id: 'warehouse', label: 'கிடங்கு இருப்பு (Warehouse)', icon: Warehouse },
            { id: 'low_stock', label: 'குறைந்த இருப்பு எச்சரிக்கை (Low Stock)', icon: AlertTriangle },
            { id: 'transfers', label: 'பரிமாற்ற வரலாறு (Transfer Logs)', icon: ArrowRightLeft },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition flex-1 sm:flex-none justify-center ${
                  activeTab === tab.id
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab !== 'transfers' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="பொருளை தேடுக..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            இருப்பு விவரங்கள் ஏற்றப்படுகின்றன (Loading stock data)...
          </div>
        ) : activeTab === 'transfers' ? (
          /* Transfer Logs Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">பரிமாற்ற எண் (Code)</th>
                  <th className="p-3">மூலம் (Source)</th>
                  <th className="p-3">சேருமிடம் (Destination)</th>
                  <th className="p-3">பொருட்கள் (Items)</th>
                  <th className="p-3">தேதி (Date)</th>
                  <th className="p-3">குறிப்பு (Notes)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      பரிமாற்றங்கள் எதுவும் இல்லை (No stock transfer history).
                    </td>
                  </tr>
                ) : (
                  transfers.map((trf) => (
                    <tr key={trf.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-emerald-800">{trf.transfer_code}</td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                          {trf.source_location}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="capitalize px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-medium">
                          {trf.destination_location}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="space-y-0.5">
                          {trf.items?.map((it, idx) => (
                            <div key={idx} className="font-semibold text-slate-800">
                              {it.product_name} ({it.variant_name}) &times; {it.quantity} {it.unit}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(trf.created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-slate-500">{trf.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Inventory Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">பொருள் பெயர் (Tamil / English)</th>
                  <th className="p-3">அளவு / வகை (Variant)</th>
                  <th className="p-3">SKU குறியீடு</th>
                  <th className="p-3">இருப்பிடம் (Location)</th>
                  <th className="p-3 text-right">கையிருப்பு (Quantity)</th>
                  <th className="p-3 text-right">குறைந்தபட்ச அளவு</th>
                  <th className="p-3 text-right">விற்பனை விலை</th>
                  <th className="p-3 text-center">நிலை (Status)</th>
                  <th className="p-3 text-right">செயல்கள் (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-400">
                      பொருட்கள் ஏதும் இல்லை (No stock rows found).
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => {
                    const isLow = item.quantity <= (item.min_stock_level || 5);
                    const isOut = item.quantity <= 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.product_name_tamil}</div>
                          {item.product_name_english && (
                            <div className="text-[11px] text-slate-400">{item.product_name_english}</div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-700">{item.variant_name}</td>
                        <td className="p-3 font-mono text-slate-500 text-[11px]">{item.sku}</td>
                        <td className="p-3">
                          <span className={`capitalize px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.location === 'store' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {item.location === 'store' ? 'கடை (Store)' : 'கிடங்கு (Warehouse)'}
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 text-sm">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right text-slate-500">
                          {item.min_stock_level} {item.unit}
                        </td>
                        <td className="p-3 text-right font-semibold text-emerald-800">
                          {formatCurrency(item.selling_price || 0)}
                        </td>
                        <td className="p-3 text-center">
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold text-[10px]">
                              கையிருப்பு இல்லை
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                              குறைந்த இருப்பு
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[10px]">
                              போதுமானது
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(item)}
                              title="Edit"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setDeletingItem(item); setDeleteError(''); }}
                              title="Delete"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Stock Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">சரக்கு பரிமாற்றம் (Stock Transfer)</h3>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-6 space-y-4 text-xs">
              {transferError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {transferError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    மூல இடம் (From)
                  </label>
                  <select
                    value={transferSource}
                    onChange={(e) => {
                      const src = e.target.value as 'warehouse' | 'store';
                      setTransferSource(src);
                      setTransferDest(src === 'warehouse' ? 'store' : 'warehouse');
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="warehouse">மொத்த கிடங்கு (Warehouse)</option>
                    <option value="store">விற்பனை கடை (Store)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    சேருமிடம் (To)
                  </label>
                  <select
                    value={transferDest}
                    onChange={(e) => {
                      const dst = e.target.value as 'warehouse' | 'store';
                      setTransferDest(dst);
                      setTransferSource(dst === 'store' ? 'warehouse' : 'store');
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="store">விற்பனை கடை (Store)</option>
                    <option value="warehouse">மொத்த கிடங்கு (Warehouse)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  பொருள் தேர்வு (Select Product Variant)
                </label>
                <select
                  required
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- பொருளை தேர்ந்தெடுக்கவும் --</option>
                  {stock.map((item) => (
                    <option key={item.id} value={item.variant_id}>
                      {item.product_name_tamil} - {item.variant_name} (இருப்பு: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  பரிமாற்ற அளவு (Quantity to Transfer)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  placeholder="எ.கா: 10"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  குறிப்புகள் (Notes / Reason)
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder="எ.கா: காலை நேர சமையல் பயன்பாட்டிற்கு"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={transferSubmitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {transferSubmitting ? 'பரிமாற்றம் நடைபெறுகிறது...' : 'பரிமாற்றத்தை உறுதி செய் (Transfer Now)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Wastage / Damage Registration */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-amber-700 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-base">சேதாரம் / கழிவு பதிவு (Record Wastage)</h3>
              </div>
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="text-amber-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAdjustment} className="p-6 space-y-4 text-xs">
              {adjError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {adjError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  பொருள் தேர்வு (Product Variant)
                </label>
                <select
                  required
                  value={adjVariantId}
                  onChange={(e) => setAdjVariantId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="">-- பொருளை தேர்ந்தெடுக்கவும் --</option>
                  {stock.map((item) => (
                    <option key={item.id} value={item.variant_id}>
                      {item.product_name_tamil} - {item.variant_name} ({item.location}: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    இடம் (Location)
                  </label>
                  <select
                    value={adjLocation}
                    onChange={(e) => setAdjLocation(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="store">விற்பனை கடை (Store)</option>
                    <option value="warehouse">மொத்த கிடங்கு (Warehouse)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    வகை (Type)
                  </label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="wastage">சமையல் கழிவு (Wastage)</option>
                    <option value="damage">பொருள் சேதாரம் (Damaged)</option>
                    <option value="adjustment">நேரடி சரிசெய்தல் (Count Audit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  கழிக்க வேண்டிய எண்ணிக்கை (Quantity to Deduct)
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(e.target.value)}
                  placeholder="எ.கா: 5"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  காரணம் (Reason for Damage/Wastage)
                </label>
                <input
                  type="text"
                  required
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="எ.கா: பாக்கெட் கசிவு / கெட்டுப்போனது"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={adjSubmitting}
                  className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {adjSubmitting ? 'பதிவாகிறது...' : 'பதிவு செய் (Record)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Stock Row (Quantity & Min Stock Level) */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-bold text-base">இருப்பை திருத்து (Edit Stock)</h3>
                  <p className="text-[11px] text-emerald-200">
                    {editingItem.product_name_tamil} - {editingItem.variant_name} ({editingItem.location})
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStock} className="p-6 space-y-4 text-xs">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    கையிருப்பு (Quantity, {editingItem.unit})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">குறைந்தபட்ச அளவு (Min Stock)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={editMinStock}
                    onChange={(e) => setEditMinStock(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">
                கையிருப்பு மாற்றங்கள் தணிக்கை பதிவேட்டில் பதிவாகும். (Quantity changes are logged in the audit trail as a manual count correction.)
              </p>

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

      {/* MODAL: Delete (Deactivate) Variant Confirmation */}
      {deletingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-base">பொருளை நீக்கு (Delete Item)</h3>
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-bold">{deletingItem.product_name_tamil} - {deletingItem.variant_name}</span> ({deletingItem.sku}) ஐ நீக்க வேண்டுமா? இது மெனு மற்றும் POS-இல் இருந்தும் மறைக்கப்படும். (This removes the SKU from inventory, menu, and POS. Past sales/purchase records are kept.)
              </p>
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-xs"
                >
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleDeleteItem}
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
    </div>
  );
}
