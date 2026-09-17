"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTask } from "@/actions/add-task";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddTaskDialogProps {
  students: { id: string; name: string }[];
  studentId?: string; // Optional for auto-selection
}

export function AddTaskDialog({ students, studentId }: AddTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await addTask(formData);
    
    if (result.success) {
      toast.success("Görev başarıyla eklendi!");
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
          Yeni Görev Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Görev Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir çalışma görevi oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="studentProfileId" className="md:text-right">
                Öğrenci
              </Label>
              <Select name="studentProfileId" required defaultValue={studentId}>
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
              <Label htmlFor="title" className="md:text-right">
                Görev Başlığı
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Örn: Matematik çalışması"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="subject" className="md:text-right">
                Ders
              </Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Örn: Matematik"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="taskType" className="md:text-right">
                Görev Tipi
              </Label>
              <Select name="taskType" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Görev tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saat">Saat</SelectItem>
                  <SelectItem value="soru">Soru</SelectItem>
                  <SelectItem value="sayfa">Sayfa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="estimatedPomodoros" className="md:text-right">
                Tahmini Pomodoro Sayısı
              </Label>
              <Input
                id="estimatedPomodoros"
                name="estimatedPomodoros"
                type="number"
                min="0"
                placeholder="Örn: 2"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="priority" className="md:text-right">
                Öncelik
              </Label>
              <Select name="priority" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="taskDate" className="md:text-right">
                Tarih
              </Label>
              <Input
                id="taskDate"
                name="taskDate"
                type="date"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Görev Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
