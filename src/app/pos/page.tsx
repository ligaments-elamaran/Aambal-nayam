'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  CreditCard, 
  QrCode, 
  Banknote, 
  Printer, 
  CheckCircle2, 
  X, 
  Sparkles, 
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface POSItem {
  variant_id: string;
  product_id: string;
  category: 'food' | 'retail';
  tamil_name: string;
  english_name: string | null;
  variant_name: string;
  sku: string;
  unit: string;
  selling_price: number;
  cost_price: number;
  store_stock: number;
  min_stock_level: number;
}

interface CartItem {
  variant_id: string;
  tamil_name: string;
  english_name: string | null;
  variant_name: string;
  unit: string;
  selling_price: number;
  quantity: number;
  max_stock: number;
}

export default function POSPage() {
  const [items, setItems] = useState<POSItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'food' | 'oils' | 'rice' | 'fresh'>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  
  // Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [checkoutError, setCheckoutError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Load catalog
  const loadCatalog = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pos/catalog');
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error('Failed to load POS catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.tamil_name.toLowerCase().includes(search.toLowerCase()) ||
      (item.english_name && item.english_name.toLowerCase().includes(search.toLowerCase())) ||
      item.variant_name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'food') return item.category === 'food';
    if (categoryFilter === 'oils') return item.sku.startsWith('OIL-') || item.tamil_name.includes('எண்ணெய்');
    if (categoryFilter === 'rice') return item.sku.startsWith('RICE-') || item.tamil_name.includes('அரிசி');
    if (categoryFilter === 'fresh') return item.sku.startsWith('FRESH-') || item.tamil_name.includes('தேங்காய்') || item.tamil_name.includes('வாழைப்பழம்');
    return true;
  });

  // Cart actions
  const addToCart = (item: POSItem) => {
    if (item.store_stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.variant_id === item.variant_id);
      if (existing) {
        if (existing.quantity >= item.store_stock) return prev;
        return prev.map((c) =>
          c.variant_id === item.variant_id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [
        ...prev,
        {
          variant_id: item.variant_id,
          tamil_name: item.tamil_name,
          english_name: item.english_name,
          variant_name: item.variant_name,
          unit: item.unit,
          selling_price: item.selling_price,
          quantity: 1,
          max_stock: item.store_stock,
        },
      ];
    });
  };

  const updateQuantity = (variant_id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variant_id) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.max_stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (variant_id: string) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashTendered('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const grandTotal = Math.max(0, subtotal - discount);
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = tenderedNum >= grandTotal ? tenderedNum - grandTotal : 0;

  // Checkout submit
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setCheckoutError('');

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({
            variant_id: c.variant_id,
            quantity: c.quantity,
            unit_price: c.selling_price,
          })),
          discount,
          payment_method: paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete sale');
      }

      setCompletedSale(data.sale);
      setShowCheckoutModal(false);
      clearCart();
      loadCatalog(); // Refresh live stock counts
    } catch (err: any) {
      setCheckoutError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* LEFT: Catalog & Filter */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Search & Category Tabs */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="பொருளை தேடவும் (Search item by Tamil or English name, SKU)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { id: 'all', label: 'அனைத்தும் (All)' },
              { id: 'food', label: 'தேநீர் & சிற்றுண்டி (Tea & Snacks)' },
              { id: 'oils', label: 'செக்கு எண்ணெய் (Oils)' },
              { id: 'rice', label: 'பாரம்பரிய அரிசி (Rice)' },
              { id: 'fresh', label: 'இயற்கை விளைபொருட்கள் (Fresh)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  categoryFilter === tab.id
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto max-h-[68vh] pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              பொருட்கள் ஏற்றப்படுகின்றன (Loading catalog)...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
              பொருட்கள் ஏதும் கிடைக்கவில்லை (No items found).
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const isOutOfStock = item.store_stock <= 0;
                const isLowStock = item.store_stock > 0 && item.store_stock <= item.min_stock_level;

                return (
                  <button
                    key={item.variant_id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(item)}
                    className={`text-left p-3.5 rounded-xl border transition flex flex-col justify-between relative group ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200 hover:border-emerald-500 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    {/* Stock badge */}
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {isOutOfStock ? 'கையிருப்பு இல்லை' : `${item.store_stock} ${item.unit}`}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.variant_name !== 'Standard' ? item.variant_name : ''}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-emerald-800 transition">
                        {item.tamil_name}
                      </h4>
                      {item.english_name && (
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {item.english_name}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-bold text-emerald-700 text-base">
                        {formatCurrency(item.selling_price)}
                      </div>
                      <div className="p-1 rounded-md bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Cart & Billing Panel */}
      <div className="w-full lg:w-96 bg-white rounded-xl shadow-md border border-slate-200 flex flex-col h-[85vh]">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-emerald-800 text-white rounded-t-xl">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-300" />
            <h3 className="font-bold text-base">பில் பட்டியல் (Cart)</h3>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-200 hover:text-white flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>அழி (Clear)</span>
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
              <Receipt className="w-12 h-12 stroke-[1.2] mb-2 opacity-50" />
              <p className="text-sm font-medium">விற்பனை பட்டியல் காலியாக உள்ளது</p>
              <p className="text-xs text-slate-400 mt-1">பொருளை சேர்க்க இடதுபுறம் கிளிக் செய்யவும்</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.variant_id}
                className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-bold text-slate-800 leading-tight">
                      {item.tamil_name}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {item.variant_name} &bull; {formatCurrency(item.selling_price)} / {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-800">
                      {formatCurrency(item.selling_price * item.quantity)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-300 rounded-md p-0.5">
                    <button
                      onClick={() => updateQuantity(item.variant_id, -1)}
                      className="p-1 text-slate-600 hover:text-red-600 hover:bg-slate-100 rounded"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variant_id, 1)}
                      disabled={item.quantity >= item.max_stock}
                      className="p-1 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.variant_id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary & Checkout Trigger */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 rounded-b-xl">
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>கூட்டுத்தொகை (Subtotal):</span>
              <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span>தள்ளுபடி (Discount ₹):</span>
              <input
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                placeholder="0"
                className="w-20 px-2 py-0.5 text-right border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>மொத்தத் தொகை (Net Total):</span>
              <span className="text-base text-emerald-800">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          <button
            onClick={() => setShowCheckoutModal(true)}
            disabled={cart.length === 0}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Banknote className="w-4 h-4" />
            <span>பணம் பெறுக (Pay {formatCurrency(grandTotal)})</span>
          </button>
        </div>
      </div>

      {/* MODAL: Checkout / Payment Selection */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-amber-300" />
                <h3 className="font-bold text-base">கட்டணம் செலுத்துதல் (Payment)</h3>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {checkoutError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  செலுத்த வேண்டிய தொகை (Amount Payable)
                </div>
                <div className="text-3xl font-extrabold text-emerald-800 mt-1">
                  {formatCurrency(grandTotal)}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  கட்டண முறை (Payment Mode)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'ரொக்கம் (Cash)', icon: Banknote },
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'card', label: 'கார்டு (Card)', icon: CreditCard },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                          paymentMethod === m.id
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash change calculator */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <label className="block text-xs font-semibold text-amber-900">
                    வாடிக்கையாளர் கொடுத்த தொகை (Tendered Amount ₹)
                  </label>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={grandTotal.toString()}
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  {tenderedNum > 0 && (
                    <div className="flex justify-between items-center pt-1 text-xs">
                      <span className="text-amber-800 font-medium">மீதி தர வேண்டியது (Change Due):</span>
                      <span className="font-bold text-sm text-emerald-800">
                        {formatCurrency(changeDue)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Display */}
              {paymentMethod === 'upi' && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
                  <div className="inline-block p-3 bg-white border border-slate-300 rounded-xl shadow-sm">
                    <QrCode className="w-24 h-24 text-slate-800 mx-auto" />
                  </div>
                  <div className="text-xs font-bold text-slate-700">UPI ID: teashop@upi</div>
                  <p className="text-[11px] text-slate-500">Scan QR Code to pay {formatCurrency(grandTotal)}</p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{submitting ? 'பதிவாகிறது...' : 'பில்லை பூர்த்தி செய் (Complete Sale)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thermal Printable Receipt */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 flex flex-col">
            <div className="bg-emerald-800 text-white p-3 flex items-center justify-between">
              <span className="text-xs font-bold">விற்பனை ரசீது (Receipt Preview)</span>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Area */}
            <div id="thermal-receipt" className="p-6 font-mono text-xs text-slate-800 space-y-3 bg-white">
              <div className="text-center space-y-1">
                <h2 className="font-bold text-base leading-tight">பாரம்பரிய சுவை தேநீர்</h2>
                <p className="text-[11px] text-slate-600">Heritage Tea Stall & Organics</p>
                <p className="text-[10px] text-slate-500">Ph: +91 98765 43210</p>
                <div className="border-b border-dashed border-slate-400 my-2"></div>
                <div className="flex justify-between text-[11px]">
                  <span>Inv: #{completedSale.invoice_number}</span>
                  <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-left text-[10px] text-slate-500">
                  Date: {new Date().toLocaleDateString('en-IN')}
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2"></div>

              {/* Items Table */}
              <div className="space-y-1.5">
                {completedSale.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div className="flex-1 pr-1">
                      <div>{item.product_name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.quantity} x ₹{item.unit_price}
                      </div>
                    </div>
                    <div className="font-bold">₹{item.line_total}</div>
                  </div>
                ))}
              </div>

              <div className="border-b border-dashed border-slate-400 my-2"></div>

              {/* Totals */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{completedSale.subtotal}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-₹{completedSale.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-300">
                  <span>Total:</span>
                  <span>₹{completedSale.grand_total}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                  <span>Mode: {completedSale.payment_method.toUpperCase()}</span>
                  <span>Status: PAID</span>
                </div>
              </div>

              <div className="border-b border-dashed border-slate-400 my-2"></div>

              <div className="text-center text-[10px] text-slate-500">
                நன்றி! மீண்டும் வருக!
                <br />
                Thank you for visiting!
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <button
                onClick={printReceipt}
                className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>அச்சிடு (Print)</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition"
              >
                மூடு (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
