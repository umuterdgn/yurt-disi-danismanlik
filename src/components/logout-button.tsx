"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      // Clear cookies
      document.cookie = 'user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Clear localStorage
      localStorage.removeItem('auth_user');
      
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <LogOut className="w-4 h-4 mr-2" />
      Çıkış Yap
    </Button>
  );
}
