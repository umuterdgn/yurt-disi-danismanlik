"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  name: string;
  email: string;
}

interface AddFinanceDialogProps {
  onFinanceAdded?: () => void;
}

export function AddFinanceDialog({ onFinanceAdded }: AddFinanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [formData, setFormData] = useState({
    studentId: '',
    packageName: '',
    totalAmount: '',
    paidAmount: '',
    currency: 'TRY',
    installmentCount: '3',
    installmentInterval: '30' // days
  });

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students');
      if (!response.ok) throw new Error('Failed to fetch students');
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Öğrenciler yüklenirken hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: formData.studentId,
          packageName: formData.packageName,
          totalAmount: parseFloat(formData.totalAmount),
          paidAmount: parseFloat(formData.paidAmount),
          currency: formData.currency,
          installmentCount: parseInt(formData.installmentCount),
          installmentInterval: parseInt(formData.installmentInterval)
        })
      });

      if (!response.ok) throw new Error('Failed to create finance record');

      toast.success('Finans kaydı başarıyla oluşturuldu!');
      setOpen(false);
      setFormData({
        studentId: '',
        packageName: '',
        totalAmount: '',
        paidAmount: '',
        currency: 'TRY',
        installmentCount: '3',
        installmentInterval: '30'
      });

      if (onFinanceAdded) {
        onFinanceAdded();
      }
    } catch (error) {
      console.error('Error creating finance record:', error);
      toast.error('Finans kaydı oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#c89f65] hover:bg-[#c89f65]/90 text-[#0f2042]">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Finans Kaydı (Paket Ekle)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#c89f65]" />
            Yeni Finans Kaydı Oluştur
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="student">Öğrenci *</Label>
              <Select
                value={formData.studentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, studentId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="packageName">Paket Adı *</Label>
              <Input
                id="packageName"
                value={formData.packageName}
                onChange={(e) => setFormData(prev => ({ ...prev, packageName: e.target.value }))}
                placeholder="Örn: Koçluk Paketi - 3 Ay"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Toplam Tutar *</Label>
              <Input
                id="totalAmount"
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                placeholder="10000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Ödenen Tutar *</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                value={formData.paidAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, paidAmount: e.target.value }))}
                placeholder="3000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installmentCount">Taksit Sayısı *</Label>
              <Input
                id="installmentCount"
                type="number"
                min="1"
                value={formData.installmentCount}
                onChange={(e) => setFormData(prev => ({ ...prev, installmentCount: e.target.value }))}
                placeholder="3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="installmentInterval">Taksit Aralığı (Gün) *</Label>
              <Input
                id="installmentInterval"
                type="number"
                min="1"
                value={formData.installmentInterval}
                onChange={(e) => setFormData(prev => ({ ...prev, installmentInterval: e.target.value }))}
                placeholder="30"
                required
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