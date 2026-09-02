"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Globe,
  Settings
} from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AdminSidebar() {
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      title: "Kullanıcılar",
      icon: Users,
      href: "/admin/users",
    },
    {
      title: "Danışmanlık Modülleri",
      icon: Users,
      subItems: [
        {
          title: "Tüm Öğrenciler",
          href: "/advisor/students",
        },
        {
          title: "Başvuru Yönetimi",
          href: "/advisor/applications",
        },
      ],
    },
    {
      title: "Randevular",
      icon: Calendar,
      href: "/admin/appointments",
    },
    {
      title: "İçerik Yönetimi",
      icon: FileText,
      subItems: [
        {
          title: "Ülke Sayfaları",
          href: "/admin/content/countries",
        },
      ],
    },
    {
      title: "Ayarlar",
      icon: Settings,
      href: "/admin/settings",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Nexa Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Yönetici Paneli</p>
      </div>

      <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.title}>
            {item.subItems ? (
              <div>
                <div className="flex items-center space-x-3 px-4 py-3 text-gray-700 font-medium">
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </div>
                <div className="ml-8 space-y-1">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className="flex items-center space-x-3 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{subItem.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                href={item.href}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 mt-auto">
        <LogoutButton />
      </div>
    </div>
  );
}