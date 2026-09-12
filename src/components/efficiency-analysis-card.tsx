import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Activity } from "lucide-react";

interface EfficiencyAnalysisData {
  subject: string;
  studyHours: string;
  avgNet: string;
  netChange: string;
  netChangeDirection: string;
  insight: string;
  recentExamsCount: number;
}

interface EfficiencyAnalysisProps {
  efficiencyAnalysis: {
    totalStudyHours: string;
    totalSessions: number;
    subjectAnalysis: EfficiencyAnalysisData[];
    period: string;
  };
}

export function EfficiencyAnalysisCard({ efficiencyAnalysis }: EfficiencyAnalysisProps) {
  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getDirectionBadge = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <Badge className="bg-green-100 text-green-700">Artış</Badge>;
      case 'declining':
        return <Badge className="bg-red-100 text-red-700">Düşüş</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700">Stabil</Badge>;
    }
  };

  const getInsightColor = (insight: string) => {
    if (insight.includes('Strateji değişmeli')) {
      return 'bg-red-50 border-red-200';
    } else if (insight.includes('Strateji işe yarıyor')) {
      return 'bg-green-50 border-green-200';
    } else if (insight.includes('Artırmak gerekiyor')) {
      return 'bg-orange-50 border-orange-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  const getInsightIcon = (insight: string) => {
    if (insight.includes('Strateji değişmeli')) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    } else if (insight.includes('Strateji işe yarıyor')) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (insight.includes('Artırmak gerekiyor')) {
      return <TrendingUp className="w-5 h-5 text-orange-600" />;
    }
    return <Activity className="w-5 h-5 text-gray-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Verimlilik Analizi (Efor vs Sonuç)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-600 mb-1">Toplam Çalışma Saati</p>
            <p className="text-2xl font-bold text-blue-900">{efficiencyAnalysis.totalStudyHours} saat</p>
            <p className="text-xs text-blue-700">{efficiencyAnalysis.period}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">Toplam Oturum</p>
            <p className="text-2xl font-bold text-purple-900">{efficiencyAnalysis.totalSessions}</p>
            <p className="text-xs text-purple-700">Pomodoro seansı</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-600 mb-1">Analiz Edilen Ders</p>
            <p className="text-2xl font-bold text-green-900">{efficiencyAnalysis.subjectAnalysis.length}</p>
            <p className="text-xs text-green-700">Farklı branş</p>
          </div>
        </div>

        {/* Subject-wise Analysis */}
        {efficiencyAnalysis.subjectAnalysis.length === 0 ? (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Henüz verimlilik analizi verisi yok.</p>
            <p className="text-sm text-gray-400 mt-2">Öğrenci çalışma oturumları ve deneme sonuçları olduğunda analiz görünecek.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {efficiencyAnalysis.subjectAnalysis.map((analysis) => (
              <div key={analysis.subject} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{analysis.subject}</h4>
                  {getDirectionBadge(analysis.netChangeDirection)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-600">Çalışma Saati</p>
                    <p className="font-medium">{analysis.studyHours} saat</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Ortalama Net</p>
                    <p className="font-medium">{analysis.avgNet}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Net Değişimi</p>
                    <div className="flex items-center gap-1">
                      {getDirectionIcon(analysis.netChangeDirection)}
                      <span className={`font-medium ${
                        analysis.netChangeDirection === 'improving' ? 'text-green-600' :
                        analysis.netChangeDirection === 'declining' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        {analysis.netChange}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Deneme Sayısı</p>
                    <p className="font-medium">{analysis.recentExamsCount}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${getInsightColor(analysis.insight)}`}>
                  <div className="flex items-start gap-2">
                    {getInsightIcon(analysis.insight)}
                    <p className="text-sm">
                      <span className="font-medium">AI Analizi:</span> {analysis.insight}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                <strong>Efor vs Sonuç Korelasyonu:</strong> Bu analiz, öğrencinin son 2 haftadaki çalışma saatleri ile deneme netleri arasındaki ilişkiyi gösterir. 
                Çalışma saatine rağmen net artışı olmayan derslerde strateji değişikliği önerilir.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}