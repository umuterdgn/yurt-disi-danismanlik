"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Activity, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface SimulationProfileDialogProps {
  students: { id: string; name: string; grade: string }[];
  selectedStudentId?: string;
}

export function SimulationProfileDialog({ students, selectedStudentId: initialSelectedStudentId }: SimulationProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialSelectedStudentId || '');

  // Reset selected student when dialog opens if no initial selection
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !initialSelectedStudentId) {
      setSelectedStudentId('');
    }
  };

  const [targetUniversity, setTargetUniversity] = useState('');
  const [burnoutRiskScore, setBurnoutRiskScore] = useState([0]);
  const [ghostCompetitorGap, setGhostCompetitorGap] = useState('');

  useEffect(() => {
    if (open) {
      loadSimulationProfile();
    }
  }, [open, selectedStudentId]);

  const loadSimulationProfile = async () => {
    if (!selectedStudentId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/advisor/students/${selectedStudentId}/simulation`);
      const data = await response.json();

      if (data.success && data.simulationProfile) {
        setTargetUniversity(data.simulationProfile.targetUniversity || '');
        setBurnoutRiskScore([data.simulationProfile.burnoutRiskScore || 0]);
        setGhostCompetitorGap(data.simulationProfile.ghostCompetitorGap?.toString() || '');
      } else {
        // Reset if no profile exists
        setTargetUniversity('');
        setBurnoutRiskScore([0]);
        setGhostCompetitorGap('');
      }
    } catch (error) {
      console.error('Error loading simulation profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedStudentId) {
      toast.error('Lütfen bir öğrenci seçin');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/advisor/students/${selectedStudentId}/simulation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUniversity: targetUniversity || null,
          burnoutRiskScore: burnoutRiskScore[0],
          ghostCompetitorGap: ghostCompetitorGap ? parseFloat(ghostCompetitorGap) : null
        })
      });

      if (!response.ok) {
        throw new Error('Simülasyon profili güncellenemedi');
      }

      toast.success('Simülasyon profili başarıyla güncellendi!');
      setOpen(false);
    } catch (error) {
      console.error('Error saving simulation profile:', error);
      toast.error('Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const getBurnoutRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBurnoutRiskLabel = (score: number) => {
    if (score >= 80) return 'YÜKSEK RİSK';
    if (score >= 60) return 'ORTA RİSK';
    if (score >= 40) return 'DÜŞÜK RİSK';
    return 'GÜVENLİ';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Simülasyon Profili
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Gelecek Simülatörü
          </DialogTitle>
          <DialogDescription>
            {selectedStudentId ? students.find(s => s.id === selectedStudentId)?.name + ' için' : 'Öğrenci seçin'} tükenmişlik skoru ve hedef üniversite ayarları
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Yükleniyor...</div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="student" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Öğrenci
              </Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.grade}. Sınıf)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Burnout Risk Score */}
            <Card className={burnoutRiskScore[0] >= 80 ? 'border-red-300 bg-red-50' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${getBurnoutRiskColor(burnoutRiskScore[0])}`} />
                  Tükenmişlik Risk Skoru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getBurnoutRiskColor(burnoutRiskScore[0])}`}>
                      {burnoutRiskScore[0]}/100
                    </span>
                    <span className={`text-sm font-medium ${getBurnoutRiskColor(burnoutRiskScore[0])}`}>
                      {getBurnoutRiskLabel(burnoutRiskScore[0])}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={burnoutRiskScore[0]}
                    onChange={(e) => setBurnoutRiskScore([Math.min(100, Math.max(0, parseInt(e.target.value) || 0))])}
                    className="w-full"
                  />
                  {burnoutRiskScore[0] >= 80 && (
                    <div className="flex items-start gap-2 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-800">
                        <strong>De-Load Haftası:</strong> Bu öğrenci için program yükü otomatik %40 azaltılacak.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Target University */}
            <div className="space-y-2">
              <Label htmlFor="targetUniversity" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Hedef Üniversite
              </Label>
              <Input
                id="targetUniversity"
                placeholder="Örn: Boğaziçi Üniversitesi"
                value={targetUniversity}
                onChange={(e) => setTargetUniversity(e.target.value)}
              />
            </div>

            {/* Ghost Competitor Gap */}
            <div className="space-y-2">
              <Label htmlFor="ghostCompetitorGap" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Gölge Rakip Uzaklığı (Net Farkı)
              </Label>
              <Input
                id="ghostCompetitorGap"
                type="number"
                step="0.1"
                placeholder="Örn: 15.5"
                value={ghostCompetitorGap}
                onChange={(e) => setGhostCompetitorGap(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Hedef üniversiteye girmek için gereken ek net farkı
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                İptal
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !selectedStudentId}
                className="flex-1"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
