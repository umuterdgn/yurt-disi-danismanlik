"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addExam } from "@/actions/add-exam";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddExamDialogProps {
  students: { id: string; name: string }[];
}

export function AddExamDialog({ students }: AddExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await addExam(formData);
    
    if (result.success) {
      toast.success("Deneme başarıyla eklendi!");
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
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Deneme Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Deneme Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir deneme sonucu ekleyin.
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
              <Label htmlFor="examName" className="md:text-right">
                Deneme Adı
              </Label>
              <Input
                id="examName"
                name="examName"
                placeholder="Örn: TYT Deneme 1"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="examDate" className="md:text-right">
                Tarih
              </Label>
              <Input
                id="examDate"
                name="examDate"
                type="date"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="actualScore" className="md:text-right">
                Net
              </Label>
              <Input
                id="actualScore"
                name="actualScore"
                type="number"
                step="0.1"
                placeholder="Örn: 350.5"
                className="col-span-1 md:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="targetScore" className="md:text-right">
                Hedef Net
              </Label>
              <Input
                id="targetScore"
                name="targetScore"
                type="number"
                step="0.1"
                placeholder="Örn: 400"
                className="col-span-1 md:col-span-3"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Deneme Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
