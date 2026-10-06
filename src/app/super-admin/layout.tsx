"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, DollarSign, Settings } from "lucide-react";

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active = false 
}: { 
  icon: any, 
  label: string, 
  href: string,
  active?: boolean 
}) => (
  <Link href={href}>
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
      active ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
    }`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
);

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 hidden lg:block">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">Nexa</h1>
          <p className="text-sm text-gray-500">Super Admin Panel</p>
        </div>
        
        <nav className="space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            href="/super-admin"
            active={pathname === "/super-admin"}
          />
          <SidebarItem 
            icon={Building2} 
            label="Müşteriler" 
            href="/super-admin/customers"
            active={pathname === "/super-admin/customers"}
          />
          <SidebarItem 
            icon={DollarSign} 
            label="Finans & Lisans" 
            href="/super-admin/finance"
            active={pathname === "/super-admin/finance"}
          />
          <SidebarItem 
            icon={Settings} 
            label="Ayarlar" 
            href="/super-admin/settings"
            active={pathname === "/super-admin/settings"}
          />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
}
