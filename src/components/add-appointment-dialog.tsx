"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addAppointment } from "@/actions/add-appointment";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddAppointmentDialogProps {
  students: { id: string; name: string }[];
}

export function AddAppointmentDialog({ students }: AddAppointmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await addAppointment(formData);
    
    if (result.success) {
      toast.success("Randevu başarıyla eklendi!");
      setOpen(false);
      window.location.reload();
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
          Yeni Randevu Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Randevu Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir görüşme randevusu oluşturun.
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
              <Label htmlFor="meetingDate" className="md:text-right">
                Tarih
              </Label>
              <Input
                id="meetingDate"
                name="meetingDate"
                type="date"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="duration" className="md:text-right">
                Süre (dk)
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="Örn: 60"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="motivationLevel" className="md:text-right">
                Motivasyon
              </Label>
              <Select name="motivationLevel" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Motivasyon seviyesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="issues" className="md:text-right">
                Sorunlar
              </Label>
              <Textarea
                id="issues"
                name="issues"
                placeholder="Öğrencinin yaşadığı sorunlar"
                className="col-span-1 md:col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="achievements" className="md:text-right">
                Başarılar
              </Label>
              <Textarea
                id="achievements"
                name="achievements"
                placeholder="Öğrencinin başarıları"
                className="col-span-1 md:col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="actionItems" className="md:text-right">
                Aksiyonlar
              </Label>
              <Textarea
                id="actionItems"
                name="actionItems"
                placeholder="Atılacak adımlar"
                className="col-span-1 md:col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="notes" className="md:text-right">
                Notlar
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Görüşme notları"
                className="col-span-1 md:col-span-3"
                rows={3}
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Randevu Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
