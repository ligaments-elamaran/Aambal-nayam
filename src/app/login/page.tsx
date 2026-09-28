'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Coffee, ShieldCheck, User as UserIcon, Lock, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // If cashier redirect directly to POS, admin to dashboard
      if (data.user?.role === 'cashier') {
        router.push('/pos');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const pickDemoUser = (user: 'admin' | 'cashier') => {
    if (user === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('cashier1');
      setPassword('cashier123');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 p-6 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-sm mb-3">
            <Coffee className="w-10 h-10 text-amber-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">பாரம்பரிய தேநீர் அரங்கம்</h2>
          <p className="text-sm text-emerald-200 mt-1">
            Heritage Tea Stall & Traditional Retail Management
          </p>
        </div>

        {/* Demo switcher buttons */}
        <div className="bg-emerald-50/70 p-4 border-b border-emerald-100 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>விரைவு உள்நுழைவு (One-Click Demo Roles):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => pickDemoUser('admin')}
              className={`text-xs px-3 py-2 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition ${
                username === 'admin'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-emerald-100 border-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>நிர்வாகி (Admin)</span>
            </button>
            <button
              type="button"
              onClick={() => pickDemoUser('cashier')}
              className={`text-xs px-3 py-2 rounded-lg font-medium border flex items-center justify-center gap-1.5 transition ${
                username === 'cashier1'
                  ? 'bg-emerald-800 text-white border-emerald-800 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-emerald-100 border-slate-200'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>காசாளர் (Cashier)</span>
            </button>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              பயனர் பெயர் (Username)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                placeholder="admin or cashier1"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              கடவுச்சொல் (Password)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-sm transition shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'உள்நுழைகிறது...' : 'உள்நுழைய (Sign In)'}
          </button>

          <div className="text-center pt-2">
            <p className="text-xs text-slate-500">
              Default credentials: <span className="font-mono text-emerald-900">admin / admin123</span> &bull;{' '}
              <span className="font-mono text-emerald-900">cashier1 / cashier123</span>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
