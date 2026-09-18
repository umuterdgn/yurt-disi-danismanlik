"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (correctCount: number, wrongCount: number) => void;
  taskType: string;
  taskTitle: string;
}

export function TaskCompletionModal({ isOpen, onClose, onConfirm, taskType, taskTitle }: TaskCompletionModalProps) {
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await onConfirm(correctCount, wrongCount);
    setLoading(false);
    onClose();
    // Reset form
    setCorrectCount(0);
    setWrongCount(0);
  };

  const isTestType = taskType === 'TEST' || taskType === 'EXAM' || taskType === 'PRACTICE';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <DialogTitle>Görev Tamamlama</DialogTitle>
          </div>
          <DialogDescription>
            {isTestType 
              ? `"${taskTitle}" görevini tamamladınız. Performansınızı girin:` 
              : `"${taskTitle}" görevini tamamladınız. Onaylıyor musunuz?`
            }
          </DialogDescription>
        </DialogHeader>
        
        {isTestType ? (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="correctCount">Doğru Sayısı</Label>
                <Input
                  id="correctCount"
                  type="number"
                  min="0"
                  value={correctCount}
                  onChange={(e) => setCorrectCount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="text-green-600 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wrongCount">Yanlış Sayısı</Label>
                <Input
                  id="wrongCount"
                  type="number"
                  min="0"
                  value={wrongCount}
                  onChange={(e) => setWrongCount(parseInt(e.target.value) || 0)}
                  placeholder="0"
                  className="text-red-600 font-semibold"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>İpucu:</strong> Bu veriler Konu Hakimiyet Analizi'nde kullanılacak ve gelecekteki görev önerilerini optimize edecektir.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-gray-600">
              Bu görev ({taskType}) performans takibi gerektirmez. Tamamlamak için onaylayın.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="bg-green-600 hover:bg-green-700">
            {loading ? "İşleniyor..." : "Görevi Tamamla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}