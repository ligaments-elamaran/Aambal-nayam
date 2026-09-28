'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Coffee, 
  ShoppingBag, 
  Boxes, 
  Users, 
  ReceiptIndianRupee, 
  TrendingUp, 
  BookOpen, 
  LogOut,
  UserCheck,
  Menu as MenuIcon,
  X
} from 'lucide-react';
import { User } from '@/types';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/login');
  };

  // Do not show full navbar on /login page
  if (pathname === '/login') {
    return (
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Coffee className="w-8 h-8 text-amber-300" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">பாரம்பரிய சுவை தேநீர் அரங்கம்</h1>
              <p className="text-xs text-emerald-200">Heritage Tea Shop & Organic Store</p>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const navLinks = [
    { href: '/', label: 'டாஷ்போர்டு (Dashboard)', icon: TrendingUp, role: 'admin' },
    { href: '/pos', label: 'விற்பனை POS (Counter)', icon: ShoppingBag, role: 'all' },
    { href: '/inventory', label: 'சரக்கு இருப்பு (Inventory)', icon: Boxes, role: 'admin' },
    { href: '/menu', label: 'பொருட்கள் (Menu & SKUs)', icon: BookOpen, role: 'admin' },
    { href: '/expenses', label: 'செலவுகள் (Expenses)', icon: ReceiptIndianRupee, role: 'admin' },
    { href: '/attendance', label: 'வருகை & ஊழியம் (Attendance)', icon: Users, role: 'admin' },
    { href: '/reports/profit-loss', label: 'லாப-நஷ்ட அறிக்கை (P&L)', icon: TrendingUp, role: 'admin' },
  ];

  const visibleLinks = navLinks.filter(
    (link) => link.role === 'all' || (user?.role === 'admin')
  );

  return (
    <nav className="bg-emerald-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-emerald-700 p-2 rounded-xl group-hover:bg-emerald-600 transition shadow-inner">
              <Coffee className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight leading-tight">பாரம்பரிய சுவை</div>
              <div className="text-[11px] text-emerald-200 leading-tight">Tea Shop & Organic Retail</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {visibleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-medium transition ${
                    isActive
                      ? 'bg-emerald-950 text-amber-300 shadow-sm border border-emerald-700/50'
                      : 'text-emerald-100 hover:bg-emerald-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 opacity-80" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User profile & actions */}
          <div className="hidden sm:flex items-center space-x-3">
            {user ? (
              <div className="flex items-center space-x-3 bg-emerald-900/80 px-3 py-1.5 rounded-lg border border-emerald-700">
                <UserCheck className="w-4 h-4 text-emerald-300" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white leading-tight">{user.name}</div>
                  <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="ml-2 p-1 text-emerald-300 hover:text-red-300 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-md text-xs font-bold transition"
              >
                உள்நுழைய (Login)
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-emerald-200 hover:text-white hover:bg-emerald-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-emerald-700 px-4 pt-3 pb-4 space-y-1 bg-emerald-900">
          {visibleLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive ? 'bg-emerald-950 text-amber-300' : 'text-emerald-100 hover:bg-emerald-800'
                }`}
              >
                <Icon className="w-5 h-5 text-amber-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {user && (
            <div className="pt-4 border-t border-emerald-800 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{user.name}</div>
                <div className="text-xs text-amber-300 uppercase">{user.role}</div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-1 text-sm bg-red-800/80 px-3 py-1.5 rounded hover:bg-red-700 text-white"
              >
                <LogOut className="w-4 h-4" />
                <span>வெளியேறு (Logout)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
