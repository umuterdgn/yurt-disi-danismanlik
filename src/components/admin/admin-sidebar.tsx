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
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminSidebar({ institutionName }: { institutionName?: string }) {
  const pathname = usePathname();
  const displayName = institutionName || 'Nexa Edu';
  
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
          title: "Üniversite & Ülke DB",
          icon: GraduationCap,
          href: "/admin/universities",
        },
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
        <div className="flex flex-col">
          <div className="font-bold text-2xl text-[#0f2042]">{displayName}</div>
          <span className="text-[10px] tracking-widest text-[#c89f65] uppercase mt-1">Eğitim Danışmanlığı</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">Yönetici Paneli</p>
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
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}