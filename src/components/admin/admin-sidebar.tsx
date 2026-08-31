"use client";

import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Globe,
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function AdminSidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Nexa Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Yönetici Paneli</p>
        </div>

        <nav className="px-4 space-y-2">
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
                        onClick={() => setSidebarOpen(false)}
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
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <Link
            href="/login"
            className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}