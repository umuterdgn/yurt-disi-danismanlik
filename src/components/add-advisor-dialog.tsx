"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddAdvisorDialogProps {
  onAdvisorAdded?: () => void;
}

export function AddAdvisorDialog({ onAdvisorAdded }: AddAdvisorDialogProps = {}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    advisorType: 'BOTH',
    specialization: '',
    experience: '',
    maxStudents: '20'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          advisorType: formData.advisorType,
          specialization: formData.specialization || null,
          experience: formData.experience ? parseInt(formData.experience) : null,
          maxStudents: parseInt(formData.maxStudents)
        })
      });

      if (!response.ok) throw new Error('Failed to create advisor');

      toast.success('Danışman başarıyla oluşturuldu!');
      setOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        advisorType: 'BOTH',
        specialization: '',
        experience: '',
        maxStudents: '20'
      });
      router.refresh();
      
      if (onAdvisorAdded) {
        onAdvisorAdded();
      }
    } catch (error) {
      console.error('Error creating advisor:', error);
      toast.error('Danışman oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#c89f65] hover:bg-[#c89f65]/90 text-[#0f2042]">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Danışman Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#c89f65]" />
            Yeni Danışman Ekle
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ahmet Yılmaz"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="ahmet@example.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Şifre *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="******"
              required
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="advisorType">Danışman Türü *</Label>
              <Select
                value={formData.advisorType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, advisorType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COACH">Eğitim Koçu</SelectItem>
                  <SelectItem value="CONSULTANT">Yurt Dışı Danışman</SelectItem>
                  <SelectItem value="BOTH">Koç & Danışman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maksimum Öğrenci Sayısı *</Label>
              <Input
                id="maxStudents"
                type="number"
                min="1"
                value={formData.maxStudents}
                onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: e.target.value }))}
                placeholder="20"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialization">Uzmanlık Alanı</Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="Örn: Matematik, Fen Bilimleri"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Deneyim (Yıl)</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                placeholder="5"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              İptal
            </Button>
            <Button
              type="submit"
              className="bg-[#c89f65] hover:bg-[#c89f65]/90 text-[#0f2042]"
              disabled={loading}
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}