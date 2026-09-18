"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Heart, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface WeeklyCheckInDialogProps {
  studentId: string;
  hasSubmittedThisWeek: boolean;
  onCheckInComplete?: () => void;
}

export function WeeklyCheckInDialog({ studentId, hasSubmittedThisWeek, onCheckInComplete }: WeeklyCheckInDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [motivationLevel, setMotivationLevel] = useState<number>(3);
  const [notes, setNotes] = useState("");

  // Open dialog automatically if not submitted this week
  useEffect(() => {
    if (!hasSubmittedThisWeek) {
      setOpen(true);
    }
  }, [hasSubmittedThisWeek]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const currentWeek = Math.ceil(new Date().getDate() / 7);
      const currentYear = new Date().getFullYear();

      const response = await fetch('/api/student/weekly-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          stressLevel,
          motivationLevel,
          notes,
          weekNumber: currentWeek,
          year: currentYear
        })
      });

      if (!response.ok) {
        throw new Error('Check-in submission failed');
      }

      toast.success("Haftalık durum bildiriminiz alındı! 👍");
      setOpen(false);
      onCheckInComplete?.();
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error("Durum bildirimi gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const getStressColor = (level: number) => {
    if (level <= 2) return 'bg-green-500';
    if (level === 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMotivationColor = (level: number) => {
    if (level >= 4) return 'bg-green-500';
    if (level === 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Reminder Banner if not submitted */}
      {!hasSubmittedThisWeek && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium text-orange-900">Bu hafta durum bildiriminizi henüz yapmadınız</p>
              <p className="text-sm text-orange-700">Danışmanınızın sizi daha iyi takip edebilmesi için lütfen durumunuzu paylaşın.</p>
            </div>
            <Button
              onClick={() => setOpen(true)}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
            >
              Bildirimi Yap
            </Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Heart className="w-4 h-4 mr-2" />
            Haftalık Durum Bildirimi
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Haftalık Durum Bildirimi
            </DialogTitle>
            <DialogDescription>
              Bu haftaki durumunuzu paylaşın, danışmanınız sizi daha iyi destekleyebilsin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Stress Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Stres Seviyeniz
              </Label>
              <RadioGroup value={stressLevel.toString()} onValueChange={(v) => setStressLevel(parseInt(v))}>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex flex-col items-center">
                      <RadioGroupItem 
                        value={level.toString()} 
                        id={`stress-${level}`}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`stress-${level}`}
                        className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          stressLevel === level 
                            ? `${getStressColor(level)} border-transparent text-white` 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {level}
                      </label>
                      <span className="text-xs mt-1 text-gray-600">
                        {level === 1 ? 'Çok Düşük' : level === 5 ? 'Çok Yüksek' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Motivation Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Motivasyon Seviyeniz
              </Label>
              <RadioGroup value={motivationLevel.toString()} onValueChange={(v) => setMotivationLevel(parseInt(v))}>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex flex-col items-center">
                      <RadioGroupItem 
                        value={level.toString()} 
                        id={`motivation-${level}`}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`motivation-${level}`}
                        className={`cursor-pointer w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          motivationLevel === level 
                            ? `${getMotivationColor(level)} border-transparent text-white` 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {level}
                      </label>
                      <span className="text-xs mt-1 text-gray-600">
                        {level === 1 ? 'Çok Düşük' : level === 5 ? 'Çok Yüksek' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ek Notlar (İsteğe Bağlı)</Label>
              <Textarea
                id="notes"
                placeholder="Bu hafta hakkında paylaşmak istediğiniz şeyler..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? 'Gönderiliyor...' : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Bildirimi Gönder
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}