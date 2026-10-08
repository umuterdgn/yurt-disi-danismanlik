"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, GraduationCap, MapPin, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { TURKISH_UNIVERSITIES } from "@/constants/universities";

interface TargetUniversityCardProps {
  targetUniversity: string | null;
  targetDepartment: string | null;
  targetScore: number | null;
  currentScore: number;
  studentId: string;
}

export function TargetUniversityCard({
  targetUniversity,
  targetDepartment,
  targetScore,
  currentScore,
  studentId
}: TargetUniversityCardProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetUniversity: targetUniversity || "",
    targetDepartment: targetDepartment || "",
    targetScore: targetScore ? targetScore.toString() : ""
  });

  const hasTarget = targetUniversity && targetDepartment && targetScore;
  const progress = targetScore && targetScore > 0 ? Math.round((currentScore / targetScore) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/student/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUniversity: formData.targetUniversity,
          targetDepartment: formData.targetDepartment,
          targetScore: parseFloat(formData.targetScore)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Hedefiniz kaydedildi! 🎯");
        setOpen(false);
        window.location.reload();
      } else {
        toast.error(data.error || "Hedef kaydedilirken hata oluştu");
      }
    } catch (error) {
      console.error('Error saving target:', error);
      toast.error("Hedef kaydedilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="bg-gradient-to-r from-[#0f2042] to-[#1a3050] text-white border-2 border-[#c89f65]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#c89f65]" />
            Hedefim
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasTarget ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-[#c89f65] mt-1" />
                <div>
                  <p className="text-sm text-[#c89f65]/80 mb-1">Hedef Üniversite</p>
                  <p className="text-lg font-semibold">{targetUniversity}</p>
                  <p className="text-sm text-[#c89f65]/60">{targetDepartment}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#c89f65] mt-1" />
                <div>
                  <p className="text-sm text-[#c89f65]/80 mb-1">Hedef Puan</p>
                  <p className="text-2xl font-bold">{targetScore}</p>
                  <p className="text-sm text-[#c89f65]/60">Mevcut: {currentScore}</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#c89f65]/80">İlerleme</span>
                  <span className="text-[#c89f65]/80">%{progress}</span>
                </div>
                <div className="w-full bg-[#c89f65]/30 rounded-full h-2">
                  <div
                    className="bg-[#c89f65] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-12 h-12 mx-auto text-[#c89f65]/60 mb-3" />
              <p className="text-[#c89f65]/80 mb-4">Henüz bir hedef belirlemedin</p>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#c89f65] text-[#0f2042] hover:bg-[#c89f65]/90 w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Hedef Belirle
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Hedef Belirle</DialogTitle>
                    <DialogDescription>
                      Hayalindeki üniversiteyi ve bölümü belirle, hedefine adım adım yaklaş.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="targetUniversity">Üniversite</Label>
                        <Select
                          value={formData.targetUniversity}
                          onValueChange={(value) => setFormData({ ...formData, targetUniversity: value })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Üniversite seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {TURKISH_UNIVERSITIES.map((uni) => (
                              <SelectItem key={uni} value={uni}>
                                {uni}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetDepartment">Bölüm</Label>
                        <Input
                          id="targetDepartment"
                          value={formData.targetDepartment}
                          onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                          placeholder="Örn: Bilgisayar Mühendisliği"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetScore">Hedef Puan</Label>
                        <Input
                          id="targetScore"
                          type="number"
                          value={formData.targetScore}
                          onChange={(e) => setFormData({ ...formData, targetScore: e.target.value })}
                          placeholder="Örn: 450"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                      >
                        İptal
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {loading ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
