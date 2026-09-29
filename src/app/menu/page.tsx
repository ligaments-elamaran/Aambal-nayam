'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Check, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'all' | 'food' | 'retail'>('all');
  const [search, setSearch] = useState('');

  // Add Product Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    category: 'food',
    tamil_name: '',
    english_name: '',
    description: '',
    variant_name: 'Standard',
    unit: 'piece',
    cost_price: '',
    selling_price: '',
    min_stock_level: '5',
    store_stock: '20',
    warehouse_stock: '50',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Product Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editFormData, setEditFormData] = useState({
    tamil_name: '',
    english_name: '',
    description: '',
  });
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          tamil_name: formData.tamil_name,
          english_name: formData.english_name || undefined,
          description: formData.description || undefined,
          variants: [
            {
              variant_name: formData.variant_name,
              unit: formData.unit,
              cost_price: Number(formData.cost_price) || 0,
              selling_price: Number(formData.selling_price) || 0,
              min_stock_level: Number(formData.min_stock_level) || 5,
              store_stock: Number(formData.store_stock) || 0,
              warehouse_stock: Number(formData.warehouse_stock) || 0,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setShowAddModal(false);
      setFormData({
        category: 'food',
        tamil_name: '',
        english_name: '',
        description: '',
        variant_name: 'Standard',
        unit: 'piece',
        cost_price: '',
        selling_price: '',
        min_stock_level: '5',
        store_stock: '20',
        warehouse_stock: '50',
      });
      loadProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      tamil_name: product.tamil_name,
      english_name: product.english_name || '',
      description: product.description || '',
    });
    setEditVariants((product.variants || []).map((v) => ({ ...v })));
    setEditError('');
  };

  const handleEditVariantChange = (variantId: string, field: keyof ProductVariant, value: string) => {
    setEditVariants((prev) =>
      prev.map((v) =>
        v.id === variantId
          ? {
              ...v,
              [field]: field === 'cost_price' || field === 'selling_price' || field === 'min_stock_level'
                ? Number(value)
                : value,
            }
          : v
      )
    );
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tamil_name: editFormData.tamil_name,
          english_name: editFormData.english_name || null,
          description: editFormData.description || null,
          variants: editVariants.map((v) => ({
            id: v.id,
            variant_name: v.variant_name,
            sku: v.sku,
            unit: v.unit,
            cost_price: v.cost_price,
            selling_price: v.selling_price,
            min_stock_level: v.min_stock_level,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setEditingProduct(null);
      loadProducts();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }
      setDeletingProduct(null);
      loadProducts();
    } catch (err: any) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch =
      p.tamil_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.english_name && p.english_name.toLowerCase().includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            <span>மெனு & பொருட்கள் அட்டவணை (Menu & Catalog)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            உணவு வகைகள், செக்கு எண்ணெய் மற்றும் பாரம்பரிய அரிசி பேக்கேஜ் SKUs
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>புதிய பொருள் சேர் (Add Item)</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
          {[
            { id: 'all', label: 'அனைத்தும் (All Items)' },
            { id: 'food', label: 'உணவு & பானங்கள் (Food & Beverages)' },
            { id: 'retail', label: 'ஆர்கானிக் சில்லறை விற்பனை (Retail Products)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex-1 sm:flex-none justify-center ${
                activeCategory === tab.id
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="மெனுவில் தேடுக..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">பொருட்கள் ஏற்றப்படுகின்றன...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">பொருள் பெயர் (Tamil / English)</th>
                  <th className="p-3">பிரிவு (Category)</th>
                  <th className="p-3">அளவுகள் / பேக்கிங் வகைகள் (Variants & SKUs)</th>
                  <th className="p-3 text-right">விற்பனை விலை</th>
                  <th className="p-3 text-right">அடக்க விலை</th>
                  <th className="p-3 text-right">மொத்த கையிருப்பு</th>
                  <th className="p-3 text-right">செயல்கள் (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 text-sm">{prod.tamil_name}</div>
                      {prod.english_name && (
                        <div className="text-[11px] text-slate-400">{prod.english_name}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        prod.category === 'food' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {prod.category === 'food' ? 'உணவு (Food)' : 'சில்லறை (Retail)'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1.5">
                        {prod.variants?.map((v) => (
                          <span
                            key={v.id}
                            className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] text-slate-700 font-medium"
                          >
                            {v.variant_name} ({v.sku})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-800">
                      {prod.variants?.map((v) => formatCurrency(v.selling_price)).join(' / ')}
                    </td>
                    <td className="p-3 text-right text-slate-500">
                      {prod.variants?.map((v) => formatCurrency(v.cost_price)).join(' / ')}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800">
                      {prod.variants?.reduce((sum, v) => sum + (v.total_stock || 0), 0)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          title="Edit"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setDeletingProduct(prod); setDeleteError(''); }}
                          title="Delete"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Add New Product */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">புதிய பொருள் சேர்த்தல் (Add Product)</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">பிரிவு (Category)</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="food">உணவு & பானங்கள் (Food)</option>
                    <option value="retail">சில்லறை விற்பனை (Retail)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">அளவு பெயர் (Variant Name)</label>
                  <input
                    type="text"
                    required
                    value={formData.variant_name}
                    onChange={(e) => setFormData({ ...formData, variant_name: e.target.value })}
                    placeholder="Standard, 500ml, 1kg"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">தமிழ் பெயர் (Tamil Name)</label>
                <input
                  type="text"
                  required
                  value={formData.tamil_name}
                  onChange={(e) => setFormData({ ...formData, tamil_name: e.target.value })}
                  placeholder="எ.கா: சுக்கு மல்லி காபி"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ஆங்கில பெயர் (English Name)</label>
                <input
                  type="text"
                  value={formData.english_name}
                  onChange={(e) => setFormData({ ...formData, english_name: e.target.value })}
                  placeholder="e.g. Sukku Malli Coffee"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">விற்பனை விலை (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="30"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">அடக்க விலை (₹)</label>
                  <input
                    type="number"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="12"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">அலகு (Unit)</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="piece">piece</option>
                    <option value="cup">cup</option>
                    <option value="plate">plate</option>
                    <option value="glass">glass</option>
                    <option value="ml">ml</option>
                    <option value="litre">litre</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">கடை இருப்பு (Store Qty)</label>
                  <input
                    type="number"
                    value={formData.store_stock}
                    onChange={(e) => setFormData({ ...formData, store_stock: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">கிடங்கு இருப்பு (Warehouse Qty)</label>
                  <input
                    type="number"
                    value={formData.warehouse_stock}
                    onChange={(e) => setFormData({ ...formData, warehouse_stock: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                >
                  {submitting ? 'சேமிக்கப்படுகிறது...' : 'பொருளை சேமி (Save Product)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Product */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">பொருளை திருத்து (Edit Product)</h3>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-emerald-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4 text-xs overflow-y-auto">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold">
                  {editError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">தமிழ் பெயர் (Tamil Name)</label>
                <input
                  type="text"
                  required
                  value={editFormData.tamil_name}
                  onChange={(e) => setEditFormData({ ...editFormData, tamil_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ஆங்கில பெயர் (English Name)</label>
                <input
                  type="text"
                  value={editFormData.english_name}
                  onChange={(e) => setEditFormData({ ...editFormData, english_name: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">விளக்கம் (Description)</label>
                <input
                  type="text"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="font-bold text-slate-700 mb-2">அளவுகள் / SKUs (Variants)</div>
                <div className="space-y-3">
                  {editVariants.map((v) => (
                    <div key={v.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-600">{v.sku}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-slate-500 mb-1">அளவு பெயர்</label>
                          <input
                            type="text"
                            value={v.variant_name}
                            onChange={(e) => handleEditVariantChange(v.id, 'variant_name', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">அலகு (Unit)</label>
                          <input
                            type="text"
                            value={v.unit}
                            onChange={(e) => handleEditVariantChange(v.id, 'unit', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-slate-500 mb-1">விற்பனை விலை (₹)</label>
                          <input
                            type="number"
                            value={v.selling_price}
                            onChange={(e) => handleEditVariantChange(v.id, 'selling_price', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">அடக்க விலை (₹)</label>
                          <input
                            type="number"
                            value={v.cost_price}
                            onChange={(e) => handleEditVariantChange(v.id, 'cost_price', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-500 mb-1">குறைந்த இருப்பு</label>
                          <input
                            type="number"
                            value={v.min_stock_level}
                            onChange={(e) => handleEditVariantChange(v.id, 'min_stock_level', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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

      {/* MODAL: Delete Confirmation */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-6 h-6" />
                <h3 className="font-bold text-base">பொருளை நீக்கு (Delete Product)</h3>
              </div>
              <p className="text-xs text-slate-600">
                <span className="font-bold">{deletingProduct.tamil_name}</span>
                {deletingProduct.english_name && ` (${deletingProduct.english_name})`} ஐ நீக்க வேண்டுமா? இது POS மற்றும் மெனுவில் இருந்து மறைக்கப்படும். (This will hide the item from the menu and POS. Past sales records are kept.)
              </p>
              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold text-xs">
                  {deleteError}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setDeletingProduct(null)}
                  className="flex-1 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition text-xs"
                >
                  ரத்து (Cancel)
                </button>
                <button
                  onClick={handleDeleteProduct}
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
