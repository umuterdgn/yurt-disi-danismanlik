"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Globe,
  Settings,
  Kanban,
  TrendingUp,
  DollarSign,
  Zap,
  Wallet,
  Briefcase,
  BarChart3,
  Cpu,
  CreditCard,
  PieChart,
  Building2,
  UserPlus,
  ShieldCheck
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const menuItems = [
    // GENEL BAKIŞ
    {
      category: "Genel Bakış",
      items: [
        {
          title: "Komuta Merkezi",
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
          title: "Tüm Öğrenciler",
          icon: Users,
          href: "/admin/students",
        },
        {
          title: "Danışmanlar & Analitik",
          icon: TrendingUp,
          href: "/admin/advisors",
        },
        {
          title: "Finans & Muhasebe",
          icon: Wallet,
          href: "/admin/finance",
        }
      ]
    },
    // SİSTEM
    {
      category: "Sistem",
      items: [
        {
          title: "Otomasyonlar & Workflow",
          icon: Zap,
          href: "/admin/workflows",
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
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}