"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users,
  Calendar
} from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';

export default function ParentSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    {
      title: 'Dashboard',
      href: '/parent/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Çocuklarım',
      href: '/parent/children',
      icon: Users,
    },
    {
      title: 'Randevular',
      href: '/parent/appointments',
      icon: Calendar,
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="font-serif font-extrabold text-3xl tracking-wide text-[#0f2042]">ATA</span>
            <span className="font-light text-2xl tracking-widest text-[#0f2042]/80 ml-1">VISION</span>
          </div>
          <span className="text-[10px] tracking-widest text-[#c89f65] uppercase mt-1">Eğitim Danışmanlığı</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Veli Paneli</p>
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
                  ? "bg-primary/10 text-primary"
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
