"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Globe,
  Settings,
  UserCheck,
  Kanban,
  TrendingUp,
  DollarSign,
  Zap
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminSidebar() {
  const menuItems = [
    // ANA EKRAN
    {
      category: "Ana Ekran",
      items: [
        {
          title: "Dashboard",
          icon: LayoutDashboard,
          href: "/admin/dashboard",
        }
      ]
    },
    // OPERASYON
    {
      category: "Operasyon",
      items: [
        {
          title: "Satış & CRM",
          icon: Kanban,
          href: "/admin/crm",
        },
        {
          title: "Finans & Muhasebe",
          icon: DollarSign,
          href: "/admin/finance",
        },
        {
          title: "Danışman Analitiği",
          icon: TrendingUp,
          href: "/admin/advisors",
        }
      ]
    },
    // SİSTEM
    {
      category: "Sistem",
      items: [
        {
          title: "Otomasyonlar",
          icon: Zap,
          href: "/admin/workflows",
        },
        {
          title: "Kullanıcılar",
          icon: Users,
          href: "/admin/users",
        },
        {
          title: "Onay Bekleyenler",
          icon: UserCheck,
          href: "/admin/pending-approvals",
        }
      ]
    },
    // DANIŞMANLIK MODÜLLERİ
    {
      category: "Danışmanlık Modülleri",
      items: [
        {
          title: "Tüm Öğrenciler",
          icon: Users,
          href: "/admin/students",
        },
        {
          title: "Başvuru Yönetimi",
          icon: FileText,
          href: "/admin/applications",
        }
      ]
    },
    // DİĞER
    {
      category: "Diğer",
      items: [
        {
          title: "Randevular",
          icon: Calendar,
          href: "/admin/appointments",
        },
        {
          title: "İçerik Yönetimi",
          icon: Globe,
          href: "/admin/content/countries",
        },
        {
          title: "Ayarlar",
          icon: Settings,
          href: "/admin/settings",
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Nexa Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Yönetici Paneli</p>
      </div>

      <nav className="p-4 space-y-6 flex-1 overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.category}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {section.category}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}