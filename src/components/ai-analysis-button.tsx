"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface AIAnalysisButtonProps {
  studentId: string;
  examResults: any[];
  subjectAnalysis: any[];
}

export function AIAnalysisButton({ studentId, examResults, subjectAnalysis }: AIAnalysisButtonProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState({
    turkish: '',
    math: '',
    science: '',
    social: ''
  });
  const [notes, setNotes] = useState('');

  async function handleAnalyze() {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          examResults,
          subjectAnalysis,
          scores: {
            turkish: scores.turkish ? parseFloat(scores.turkish) : 0,
            math: scores.math ? parseFloat(scores.math) : 0,
            science: scores.science ? parseFloat(scores.science) : 0,
            social: scores.social ? parseFloat(scores.social) : 0,
          },
          notes
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("AI analizi başarıyla oluşturuldu!");
        setOpen(false);
      } else {
        toast.error(data.error || "Analiz oluşturulurken hata oluştu");
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      toast.error("Analiz oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Netleri Gir / Analiz Et
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-full">
          <DialogHeader>
            <DialogTitle>Öğrenci Netlerini Girin</DialogTitle>
            <DialogDescription>
              Öğrencinin son deneme sonuçlarını girin, AI destekli analiz oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="turkish">Türkçe Net</Label>
                <Input
                  id="turkish"
                  type="number"
                  step="0.1"
                  placeholder="Örn: 35.5"
                  value={scores.turkish}
                  onChange={(e) => setScores({ ...scores, turkish: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="math">Matematik Net</Label>
                <Input
                  id="math"
                  type="number"
                  step="0.1"
                  placeholder="Örn: 25.0"
                  value={scores.math}
                  onChange={(e) => setScores({ ...scores, math: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="science">Fen Bilimleri Net</Label>
                <Input
                  id="science"
                  type="number"
                  step="0.1"
                  placeholder="Örn: 20.5"
                  value={scores.science}
                  onChange={(e) => setScores({ ...scores, science: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="social">Sosyal Bilimler Net</Label>
                <Input
                  id="social"
                  type="number"
                  step="0.1"
                  placeholder="Örn: 30.0"
                  value={scores.social}
                  onChange={(e) => setScores({ ...scores, social: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Ek Notlar (Opsiyonel)</Label>
              <Textarea
                id="notes"
                placeholder="Öğrenci hakkında ek bilgiler, zorlandığı konular vb."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analiz Ediliyor...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analiz Et
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {analysis && (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI Analiz Raporu
              </h3>
              <div className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
