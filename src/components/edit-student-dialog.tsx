"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface EditStudentDialogProps {
  studentId: string;
  currentTargetScore?: number | null;
  currentTargetUniversity?: string | null;
  currentTargetMajor?: string | null;
}

export function EditStudentDialog({ 
  studentId, 
  currentTargetScore, 
  currentTargetUniversity, 
  currentTargetMajor
}: EditStudentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [targetScore, setTargetScore] = useState(currentTargetScore?.toString() || '');
  const [targetUniversity, setTargetUniversity] = useState(currentTargetUniversity || '');
  const [targetMajor, setTargetMajor] = useState(currentTargetMajor || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/advisor/students/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          targetScore: targetScore ? parseFloat(targetScore) : null,
          targetUniversity: targetUniversity || null,
          targetMajor: targetMajor || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Güncelleme başarısız');
      }

      toast.success('Öğrenci bilgileri güncellendi!');
      setOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="w-4 h-4 mr-2" />
          Öğrenciyi Düzenle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Öğrenci Hedeflerini Düzenle</DialogTitle>
          <DialogDescription>
            Öğrencinin hedef puanı ve üniversite bilgilerini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetScore" className="text-right">
                Hedef Puan
              </Label>
              <Input
                id="targetScore"
                type="number"
                step="0.1"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="col-span-3"
                placeholder="Örn: 400"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetUniversity" className="text-right">
                Hedef Üniversite
              </Label>
              <Input
                id="targetUniversity"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
                className="col-span-3"
                placeholder="Örn: Boğaziçi Üniversitesi"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="targetMajor" className="text-right">
                Hedef Bölüm
              </Label>
              <Input
                id="targetMajor"
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="col-span-3"
                placeholder="Örn: Bilgisayar Mühendisliği"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}