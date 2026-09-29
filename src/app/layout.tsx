import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/navbar';

export const metadata: Metadata = {
  title: 'Aambal Nayam',
  description: 'Traditional Tea Shop, Organic Store Inventory, Attendance & POS Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
