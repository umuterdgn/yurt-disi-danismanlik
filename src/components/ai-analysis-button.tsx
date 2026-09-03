"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  async function handleAnalyze() {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/analyze-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examResults,
          subjectAnalysis
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        toast.success("AI analizi başarıyla oluşturuldu!");
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
            Netleri Gir / Analiz Et
          </>
        )}
      </Button>

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
