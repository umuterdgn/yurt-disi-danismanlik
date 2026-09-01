"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  FileText,
  GraduationCap
} from 'lucide-react';

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function StudentSidebar({ isOpen = false, onClose }: StudentSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    {
      title: 'Dashboard',
      href: '/student/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Çalışma Programları',
      href: '/student/tasks',
      icon: Calendar,
    },
    {
      title: 'Deneme Sonuçları',
      href: '/student/exams',
      icon: TrendingUp,
    },
    {
      title: 'Yurt Dışı Başvurular',
      href: '/student/study-abroad',
      icon: GraduationCap,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 hidden md:flex flex-col bg-white border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600">Nexa</h1>
          <p className="text-sm text-gray-500 mt-1">Öğrenci Paneli</p>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <div className="fixed inset-y-0 left-0 z-50 w-64 md:hidden flex flex-col bg-white border-r border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-blue-600">Nexa</h1>
            <p className="text-sm text-gray-500 mt-1">Öğrenci Paneli</p>
          </div>

          <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
