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
import { LogoutButton } from '@/components/logout-button';
import { NotificationBell } from '@/components/notification-bell';

interface StudentSidebarProps {
  userId: string;
  initialNotifications?: any[];
}

export default function StudentSidebar({ userId, initialNotifications = [] }: StudentSidebarProps) {
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
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Nexa</h1>
          <p className="text-sm text-gray-500 mt-1">Öğrenci Paneli</p>
        </div>
        <NotificationBell userId={userId} initialNotifications={initialNotifications} />
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

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}
