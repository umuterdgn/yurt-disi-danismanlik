"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  FileText,
  GraduationCap,
  Sparkles,
  PenTool,
  Plane,
  CheckSquare,
  FolderOpen,
  Compass,
  Map,
  Brain
} from 'lucide-react';
import { LogoutButton } from '@/components/logout-button';
import { NotificationBell } from '@/components/notification-bell';

interface StudentSidebarProps {
  userId: string;
  initialNotifications?: any[];
  serviceType?: string;
}

export default function StudentSidebar({ userId, initialNotifications = [], serviceType = 'BOTH' }: StudentSidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    // ANA EKRAN (Tüm Öğrenciler)
    {
      category: 'Ana Ekran',
      items: [
        {
          title: 'Dashboard & Yolculuğum',
          href: '/student/dashboard',
          icon: LayoutDashboard,
          visibleFor: ['COACHING', 'STUDY_ABROAD', 'BOTH']
        },
        {
          title: 'Takvim',
          href: '/student/calendar',
          icon: Calendar,
          visibleFor: ['COACHING', 'STUDY_ABROAD', 'BOTH']
        }
      ]
    },
    // EĞİTİM KOÇLUĞU (Sadece COACHING veya BOTH)
    {
      category: 'Eğitim Koçluğu',
      items: [
        {
          title: 'Haftalık Çalışma Programım',
          href: '/student/study-plan',
          icon: Brain,
          visibleFor: ['COACHING', 'BOTH']
        },
        {
          title: 'Çalışma Masası & Pomodoro',
          href: '/student/tasks',
          icon: CheckSquare,
          visibleFor: ['COACHING', 'BOTH']
        },
        {
          title: 'Denemeler & Analiz',
          href: '/student/exams',
          icon: TrendingUp,
          visibleFor: ['COACHING', 'BOTH']
        }
      ]
    },
    // YURT DIŞI (Sadece STUDY_ABROAD veya BOTH)
    {
      category: 'Yurt Dışı',
      items: [
        {
          title: 'Niyet Mektubu AI',
          href: '/student/sop-assistant',
          icon: PenTool,
          visibleFor: ['STUDY_ABROAD', 'BOTH']
        },
        {
          title: 'Vize Durumu',
          href: '/student/applications',
          icon: Plane,
          visibleFor: ['STUDY_ABROAD', 'BOTH']
        },
        {
          title: 'Evraklarım',
          href: '/student/documents',
          icon: FolderOpen,
          visibleFor: ['STUDY_ABROAD', 'BOTH']
        }
      ]
    }
  ];

  const filterItemsByServiceType = (items: any[]) => {
    return items.filter(item => {
      if (!item.visibleFor) return true; // Show items without visibility restrictions
      return item.visibleFor.includes(serviceType);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-serif font-extrabold text-3xl tracking-wide text-[#0f2042]">ATA</span>
              <span className="font-light text-2xl tracking-widest text-[#0f2042]/80 ml-1">VISION</span>
            </div>
            <span className="text-[10px] tracking-widest text-[#c89f65] uppercase mt-1">Eğitim Danışmanlığı</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Öğrenci Paneli</p>
        </div>
        <NotificationBell userId={userId} initialNotifications={initialNotifications} />
      </div>

      <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
        {navItems.map((section) => {
          const filteredItems = filterItemsByServiceType(section.items);
          if (filteredItems.length === 0) return null;

          return (
            <div key={section.category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <ul className="space-y-1">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}
