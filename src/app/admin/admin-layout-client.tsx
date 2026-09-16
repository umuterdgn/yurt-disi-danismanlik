"use client";

import { useState } from 'react';
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Menu, GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-white border-r">
        <AdminSidebar />
      </aside>

      {/* Mobile Header */}
      <header className="flex md:hidden h-16 items-center justify-between px-4 bg-white border-b sticky top-0 z-40 w-full">
        <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-[#0f2042]" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-serif font-extrabold text-xl tracking-wide text-[#0f2042]">ATA</span>
              <span className="font-light text-lg tracking-widest text-[#0f2042]/80">VISION</span>
            </div>
            <p className="text-xs text-gray-500">Yönetici Paneli</p>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden flex flex-col bg-white border-r">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-[#0f2042]" />
                <div className="flex items-baseline gap-1">
                  <span className="font-serif font-extrabold text-lg tracking-wide text-[#0f2042]">ATA</span>
                  <span className="font-light text-base tracking-widest text-[#0f2042]/80">VISION</span>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <AdminSidebar />
          </div>
        </>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 w-full min-h-screen overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
