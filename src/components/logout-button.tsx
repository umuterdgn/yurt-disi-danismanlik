"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      await supabase.auth.signOut();
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
