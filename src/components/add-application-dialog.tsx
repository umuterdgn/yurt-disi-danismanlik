"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addApplication } from "@/actions/add-application";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddApplicationDialogProps {
  students: { id: string; name: string }[];
  universities: { id: string; name: string; country: string }[];
}

export function AddApplicationDialog({ students, universities }: AddApplicationDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await addApplication(formData);
    
    if (result.success) {
      toast.success("Başvuru başarıyla eklendi!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Başvuru Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Başvuru Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir yurt dışı üniversite başvurusu oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="studentProfileId" className="md:text-right">
                Öğrenci
              </Label>
              <Select name="studentProfileId" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="universityId" className="md:text-right">
                Üniversite
              </Label>
              <Select name="universityId" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Üniversite seçin" />
                </SelectTrigger>
                <SelectContent>
                  {universities.map((university) => (
                    <SelectItem key={university.id} value={university.id}>
                      {university.name} ({university.country})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="program" className="md:text-right">
                Bölüm
              </Label>
              <Input
                id="program"
                name="program"
                placeholder="Örn: Bilgisayar Mühendisliği"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="semester" className="md:text-right">
                Dönem
              </Label>
              <Select name="semester" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Dönem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall">Güz (Fall)</SelectItem>
                  <SelectItem value="Spring">Bahar (Spring)</SelectItem>
                  <SelectItem value="Summer">Yaz (Summer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="year" className="md:text-right">
                Yıl
              </Label>
              <Input
                id="year"
                name="year"
                type="number"
                placeholder="Örn: 2025"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="status" className="md:text-right">
                Durum
              </Label>
              <Select name="status" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Başvuru durumu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INITIAL_INTERVIEW">Ön Görüşme</SelectItem>
                  <SelectItem value="DOCUMENT_COLLECTION">Belge Toplama</SelectItem>
                  <SelectItem value="SUBMITTED">Başvuru Yapıldı</SelectItem>
                  <SelectItem value="ACCEPTED">Kabul Edildi</SelectItem>
                  <SelectItem value="PAYMENT">Ödeme Bekliyor</SelectItem>
                  <SelectItem value="VISA">Vize Sürecinde</SelectItem>
                  <SelectItem value="ACCOMMODATION">Konaklama</SelectItem>
                  <SelectItem value="COMPLETED">Tamamlandı</SelectItem>
                  <SelectItem value="REJECTED">Reddedildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Başvuru Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
