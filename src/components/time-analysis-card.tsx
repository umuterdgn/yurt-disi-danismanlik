import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface TimeAnalysisData {
  subject: string;
  avgTimeSeconds: number;
  avgTimeFormatted: string;
  totalQuestions: number;
  correctRate: number;
  avgTimePerCorrect: number;
  avgTimePerWrong: number;
}

interface TimeAnalysisCardProps {
  timeAnalysis: TimeAnalysisData[];
}

export function TimeAnalysisCard({ timeAnalysis }: TimeAnalysisCardProps) {
  const getTimeIcon = (avgTime: number) => {
    // Average time per question should be around 2-3 minutes (120-180 seconds)
    if (avgTime > 240) {
      return <TrendingUp className="w-4 h-4 text-red-600" />;
    } else if (avgTime < 60) {
      return <TrendingDown className="w-4 h-4 text-yellow-600" />;
    }
    return <Clock className="w-4 h-4 text-green-600" />;
  };

  const getTimeMessage = (avgTime: number, subject: string) => {
    if (avgTime > 240) {
      return `${subject} problemlerinde çözüm süresi çok uzun. Hız artırılmalı.`;
    } else if (avgTime < 60) {
      return `${subject} problemlerinde çok hızlı çözülüyor. Dikkat eksikliği olabilir.`;
    }
    return `${subject} problemlerinde ideal çözüm süresi.`;
  };

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins} dk ${secs} sn`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Zaman Analizi (Soru Bazlı)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {timeAnalysis.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Henüz zaman analizi verisi yok.</p>
            <p className="text-sm text-gray-400 mt-2">Öğrenci deneme soruları çözdükçe veriler burada görünecek.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {timeAnalysis.map((analysis) => (
              <div key={analysis.subject} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTimeIcon(analysis.avgTimeSeconds)}
                    <h4 className="font-semibold text-gray-900">{analysis.subject}</h4>
                  </div>
                  <Badge 
                    className={
                      analysis.avgTimeSeconds > 240 ? 'bg-red-100 text-red-700' :
                      analysis.avgTimeSeconds < 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }
                  >
                    {analysis.avgTimeFormatted}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Toplam Soru</p>
                    <p className="font-medium">{analysis.totalQuestions}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Doğru Oranı</p>
                    <p className="font-medium">%{analysis.correctRate.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Doğru Ort. Süre</p>
                    <p className="font-medium">{formatSeconds(analysis.avgTimePerCorrect)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Yanlış Ort. Süre</p>
                    <p className="font-medium">{formatSeconds(analysis.avgTimePerWrong)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Analiz:</span> {getTimeMessage(analysis.avgTimeSeconds, analysis.subject)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                <strong>Not:</strong> Bu analiz, öğrencinin deneme sınavlarında soru başına harcadığı ortalama süreyi gösterir. 
                İdeal çözüm süresi dersi göre değişmekle birlikte genellikle 2-3 dakika arasındadır.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}