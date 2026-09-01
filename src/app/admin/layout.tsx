"use client";

import { useState } from 'react';
import AdminSidebar from "@/components/admin/admin-sidebar";
import { Menu, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between p-4 border-b bg-white w-full sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nexa Admin</h1>
            <p className="text-xs text-gray-500">Yönetici Paneli</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="ml-0 lg:ml-64 min-h-screen p-4 md:p-8 w-full max-w-full">
        {children}
      </main>
    </div>
  );
}