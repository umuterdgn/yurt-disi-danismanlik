"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageSquare,
  FileText,
  Building2,
  Globe,
  GraduationCap,
  Plane,
  CheckSquare,
  File as FileIcon,
  Timer,
  BarChart3,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LogoutButton } from '@/components/logout-button';

interface SidebarProps {
  userRole: 'SUPER_ADMIN' | 'ADVISOR' | 'COACH';
  advisorType?: 'COACH' | 'CONSULTANT' | 'BOTH';
}

export function Sidebar({ userRole, advisorType = 'BOTH' }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const navItems = [
    // ANA EKRAN
    {
      category: 'Ana Ekran',
      items: [
        {
          title: 'Dashboard',
          href: '/advisor/dashboard',
          icon: LayoutDashboard,
          roles: ['ADVISOR', 'COACH']
        },
        {
          title: 'Öğrencilerim',
          href: '/advisor/students',
          icon: Users,
          roles: ['ADVISOR', 'COACH']
        }
      ]
    },
    // EĞİTİM KOÇLUĞU MODÜLÜ
    {
      category: 'Eğitim Koçluğu',
      items: [
        {
          title: 'Görevler & Pomodoro',
          href: '/advisor/tasks',
          icon: CheckSquare,
          roles: ['ADVISOR', 'COACH'],
          requiresConsultant: false
        },
        {
          title: 'Deneme & Analiz',
          href: '/advisor/exams',
          icon: TrendingUp,
          roles: ['ADVISOR', 'COACH'],
          requiresConsultant: false
        },
        {
          title: 'Takvim & Görüşmeler',
          href: '/advisor/meetings',
          icon: Calendar,
          roles: ['ADVISOR', 'COACH'],
          requiresConsultant: false
        },
        {
          title: '🚨 Risk Radarı',
          href: '/advisor/risk-radar',
          icon: AlertTriangle,
          roles: ['ADVISOR', 'COACH'],
          requiresConsultant: false
        }
      ]
    },
    // YURT DIŞI DANIŞMANLIK MODÜLÜ
    {
      category: 'Yurt Dışı Danışmanlık',
      items: [
        {
          title: 'Başvuru Takibi',
          href: '/advisor/applications',
          icon: FileText,
          roles: ['ADVISOR'],
          requiresConsultant: true
        },
        {
          title: 'Evrak Yönetimi',
          href: '/advisor/documents',
          icon: FileIcon,
          roles: ['ADVISOR'],
          requiresConsultant: true
        },
        {
          title: 'Vize CRM',
          href: '/advisor/visa',
          icon: Plane,
          roles: ['ADVISOR'],
          requiresConsultant: true
        },
        {
          title: 'Üniversiteler & Ülkeler',
          href: '/advisor/universities',
          icon: Globe,
          roles: ['ADVISOR'],
          requiresConsultant: true
        }
      ]
    }
  ];

  const canAccessItem = (item: any) => {
    if (!item.roles.includes(userRole)) return false;
    if (item.requiresConsultant && advisorType === 'COACH') return false;
    return true;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">Nexa</h1>
        <p className="text-sm text-gray-500 mt-1">
          {advisorType === 'COACH' ? 'Eğitim Koçluğu' : advisorType === 'CONSULTANT' ? 'Yurt Dışı Danışmanlık' : 'Danışman Paneli'}
        </p>
      </div>

      <nav className="p-4 space-y-6 overflow-y-auto flex-1">
        {navItems.map((section) => {
          const accessibleItems = section.items.filter(canAccessItem);
          if (accessibleItems.length === 0) return null;

          return (
            <div key={section.category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {section.category}
              </h3>
              <ul className="space-y-1">
                {accessibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-700"
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
        <div className="flex items-center space-x-2 mb-3">
          <Badge className={cn(
            "text-xs",
            userRole === 'SUPER_ADMIN' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
          )}>
            {userRole}
          </Badge>
          {advisorType !== 'BOTH' && (
            <Badge className="text-xs bg-green-100 text-green-700">
              {advisorType === 'COACH' ? 'Koç' : 'Danışman'}
            </Badge>
          )}
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
