"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, TrendingUp } from "lucide-react";

interface SubjectResult {
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number | null;
}

interface Exam {
  id: string;
  title?: string;
  date?: Date | string;
  totalNet?: number | null;
  subjectResults?: SubjectResult[];
}

interface MasteryMapProps {
  exams: Exam[];
}

export function MasteryMap({ exams }: MasteryMapProps) {
  const calculateMasteryData = () => {
    if (exams.length === 0) {
      return null;
    }

    // Group by subject and calculate mastery percentages
    const subjectMastery: Record<string, { correct: number; total: number; net: number }> = {};

    exams.forEach(exam => {
      if (!exam.subjectResults) return;
      
      exam.subjectResults.forEach(subject => {
        if (!subjectMastery[subject.subjectName]) {
          subjectMastery[subject.subjectName] = { correct: 0, total: 0, net: 0 };
        }
        subjectMastery[subject.subjectName].correct += subject.correct;
        subjectMastery[subject.subjectName].total += subject.correct + subject.wrong + subject.empty;
        subjectMastery[subject.subjectName].net += subject.net || 0;
      });
    });

    // Calculate percentages
    const masteryData = Object.entries(subjectMastery).map(([subject, data]) => {
      const percentage = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      const avgNet = exams.length > 0 ? data.net / exams.length : 0;
      
      return {
        subject,
        percentage: Math.round(percentage),
        avgNet: avgNet.toFixed(2),
        totalQuestions: data.total,
        totalCorrect: data.correct
      };
    });

    return masteryData;
  };

  const masteryData = calculateMasteryData();

  const getMasteryColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMasteryLabel = (percentage: number) => {
    if (percentage >= 80) return 'Mükemmel';
    if (percentage >= 60) return 'İyi';
    if (percentage >= 40) return 'Orta';
    return 'Zayıf';
  };

  const getMasteryEmoji = (percentage: number) => {
    if (percentage >= 80) return '🟢';
    if (percentage >= 60) return '🔵';
    if (percentage >= 40) return '🟡';
    return '🔴';
  };

  if (!masteryData || masteryData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Konu Hakimiyet Haritası
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="font-medium">Henüz yeterli veri oluşmadı</p>
            <p className="text-sm mt-2">Deneme sonuçları girdikçe konu hakimiyetiniz burada görüntülenecek.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Konu Hakimiyet Haritası
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {masteryData.map((data) => (
            <div key={data.subject} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getMasteryEmoji(data.percentage)}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{data.subject}</h4>
                    <p className="text-xs text-gray-600">
                      {data.totalCorrect}/{data.totalQuestions} doğru • Ort. Net: {data.avgNet}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getMasteryColor(data.percentage).replace('bg-', 'bg-opacity-100 text-white ')}>
                    {getMasteryLabel(data.percentage)}
                  </Badge>
                  <span className="text-sm font-semibold text-gray-700">%{data.percentage}</span>
                </div>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div 
                  className={`h-full transition-all ${getMasteryColor(data.percentage)}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Toplam Ders</p>
              <p className="text-2xl font-bold text-blue-600">{masteryData.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ortalama Başarı</p>
              <p className="text-2xl font-bold text-green-600">
                %{Math.round(masteryData.reduce((sum, d) => sum + d.percentage, 0) / masteryData.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Güçlü Dersler</p>
              <p className="text-2xl font-bold text-purple-600">
                {masteryData.filter(d => d.percentage >= 60).length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}