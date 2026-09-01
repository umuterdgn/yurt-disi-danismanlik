"use client";

import { useState } from 'react';
import ParentSidebar from '@/components/parent/parent-sidebar';
import { Menu, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      <ParentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile Top Bar */}
      <div className="flex md:hidden items-center justify-between p-4 border-b bg-white w-full sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nexa</h1>
            <p className="text-xs text-gray-500">Veli Paneli</p>
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

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 w-full max-w-full">
        {children}
      </main>
    </div>
  );
}
