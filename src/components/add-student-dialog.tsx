"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addStudent } from "@/actions/add-student";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    const result = await addStudent(formData);
    
    if (result.success) {
      toast.success("Öğrenci başarıyla eklendi!");
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
          Yeni Öğrenci Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir öğrenci eklemek için bilgileri doldurun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="name" className="md:text-right">
                Ad Soyad
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Örn: Ahmet Yılmaz"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="email" className="md:text-right">
                E-posta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ogrenci@example.com"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="password" className="md:text-right">
                Şifre
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="******"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="grade" className="md:text-right">
                Sınıf
              </Label>
              <Input
                id="grade"
                name="grade"
                placeholder="Örn: 12"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="targetUniversity" className="md:text-right">
                Hedef Üniversite
              </Label>
              <Input
                id="targetUniversity"
                name="targetUniversity"
                placeholder="Örn: Varşova Üniversitesi"
                className="col-span-1 md:col-span-3"
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Öğrenci Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
