"use client";

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { Menu, GraduationCap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdvisorLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar - Fixed */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-white border-r">
        <Sidebar userRole="ADVISOR" advisorType="BOTH" />
      </aside>

      {/* Mobile Header */}
      <header className="flex md:hidden h-16 items-center justify-between px-4 bg-white border-b sticky top-0 z-40 w-full">
        <div className="flex items-center space-x-2">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">Nexa</h1>
            <p className="text-xs text-gray-500">Danışman Paneli</p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-64 md:hidden flex flex-col bg-white border-r">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <span className="text-lg font-bold text-gray-900">Nexa</span>
              </div>
              <Button variant="outline" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <Sidebar userRole="ADVISOR" advisorType="BOTH" />
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
