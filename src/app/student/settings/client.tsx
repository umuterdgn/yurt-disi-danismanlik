"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateStudentSettings } from "@/actions/update-student-settings";
import { toast } from "sonner";

interface StudentSettingsClientProps {
  studentProfile: any;
  symbols: { emoji: string; name: string }[];
}

export default function StudentSettingsClient({ studentProfile, symbols }: StudentSettingsClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await updateStudentSettings(formData);
    
    if (result.success) {
      toast.success("Ayarlar başarıyla güncellendi!");
      setLoading(false);
      router.refresh();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="studentSymbol">Sembol Seçimi</Label>
          <Select name="studentSymbol" defaultValue={studentProfile?.studentSymbol || "🎓"}>
            <SelectTrigger>
              <SelectValue placeholder="Sembol seçin" />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((symbol) => (
                <SelectItem key={symbol.emoji} value={symbol.emoji}>
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{symbol.emoji}</span>
                    <span>{symbol.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500">
            Profilinizde görünecek sembolü seçin
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Mevcut Şifre</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            placeholder="Mevcut şifreniz"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Yeni Şifre</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            placeholder="Yeni şifreniz"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Yeni şifrenizi tekrar girin"
          />
        </div>

        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Güncelleniyor..." : "Ayarları Güncelle"}
        </Button>
      </div>
    </form>
  );
}
