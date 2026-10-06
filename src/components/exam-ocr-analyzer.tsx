"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AnalysisResult {
  questionType: string;
  errorType: string;
  feedback: string;
}

export function ExamOCRAnalyzer({ studentId }: { studentId: string }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      toast.error('Lütfen bir görsel yükleyin');
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/analyze-exam', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Analiz başarısız');
      }

      setResult(data.analysis);
      toast.success('Analiz tamamlandı!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Analiz sırasında hata oluştu');
    } finally {
      setAnalyzing(false);
    }
  };

  const getErrorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'KNOWLEDGE_GAP': 'Bilgi Eksikliği',
      'LOGIC_ERROR': 'Mantık Hatası',
      'CALCULATION_ERROR': 'İşlem Hatası',
      'ATTENTION_DEFICIT': 'Dikkat Eksikliği',
    };
    return labels[type] || type;
  };

  const getErrorTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'KNOWLEDGE_GAP': 'bg-red-100 text-red-700',
      'LOGIC_ERROR': 'bg-orange-100 text-orange-700',
      'CALCULATION_ERROR': 'bg-yellow-100 text-yellow-700',
      'ATTENTION_DEFICIT': 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'YENI_NESIL': 'Yeni Nesil',
      'KLASIK': 'Klasik',
    };
    return labels[type] || type;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Soru/Kağıt Analiz Et (AI OCR)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAnalyze} className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              name="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              required
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-48 rounded-lg"
                />
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Görseli sürükleyip bırakın veya tıklayın
                  </p>
                  <p className="text-xs text-gray-500">
                    .jpg, .png formatları desteklenir
                  </p>
                </>
              )}
            </label>
          </div>

          {/* Analyze Button */}
          <Button
            type="submit"
            disabled={analyzing || !preview}
            className="w-full"
          >
            {analyzing ? (
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
        </form>

        {/* Analysis Result */}
        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Analiz Sonucu
              </h3>

              <div className="space-y-3">
                {/* Question Type */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Soru Tipi:</span>
                  <Badge variant="outline">
                    {getQuestionTypeLabel(result.questionType)}
                  </Badge>
                </div>

                {/* Error Type */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Hata Türü:</span>
                  <Badge className={getErrorTypeColor(result.errorType)}>
                    {getErrorTypeLabel(result.errorType)}
                  </Badge>
                </div>

                {/* Feedback */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        Bilişsel Geri Bildirim
                      </p>
                      <p className="text-sm text-blue-800">
                        {result.feedback}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
