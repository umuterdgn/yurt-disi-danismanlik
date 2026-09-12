"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle, AlertTriangle, Lightbulb, FileText } from "lucide-react";
import { toast } from "sonner";
import { analyzeSOPWithAI } from "@/actions/ai-sop-analyzer";

interface SOPAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallScore: number;
  wordCount: number;
  readabilityScore: number;
}

export function SOPAssistantForm() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SOPAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Lütfen analiz edilecek metni girin");
      return;
    }

    if (text.length < 200) {
      toast.error("Metin çok kısa. En az 200 karakter girin");
      return;
    }

    setLoading(true);

    try {
      const result = await analyzeSOPWithAI(text);
      
      if (result.success && result.analysis) {
        setAnalysis(result.analysis);
        toast.success("Analiz tamamlandı!");
      } else {
        toast.error(result.error || "Analiz sırasında bir hata oluştu");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-700">Mükemmel</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-700">İyi</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-700">Geliştirilebilir</Badge>;
    return <Badge className="bg-red-100 text-red-700">Zayıf</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          SOP / Motivation Letter Metni
        </label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Niyet mektubu taslağınızı buraya yapıştırın..."
          className="min-h-[300px] resize-y"
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {text.length} karakter
          </span>
          <Button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analiz Ediliyor...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Analizi İste
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Analiz Sonuçları
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                      %{analysis.overallScore}
                    </div>
                    <div className="text-xs text-gray-600">Genel Skor</div>
                  </div>
                  {getScoreBadge(analysis.overallScore)}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.wordCount}</div>
                  <div className="text-xs text-gray-600">Kelime Sayısı</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className={`text-2xl font-bold ${getScoreColor(analysis.readabilityScore)}`}>
                    %{analysis.readabilityScore}
                  </div>
                  <div className="text-xs text-gray-600">Okunabilirlik</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-green-900">
                <CheckCircle className="w-5 h-5" />
                Güçlü Yönler
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span className="text-sm text-green-900">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-900">
                <AlertTriangle className="w-5 h-5" />
                Eksikler / Geliştirme Alanları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">⚠</span>
                    <span className="text-sm text-yellow-900">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Suggestions */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-blue-900">
                <Lightbulb className="w-5 h-5" />
                Düzeltme Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">💡</span>
                    <span className="text-sm text-blue-900">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}