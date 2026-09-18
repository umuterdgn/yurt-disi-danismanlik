"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2 } from "lucide-react";

interface SubjectMasteryData {
  subject: string;
  topic: string;
  successRate: number;
  totalAttempts: number;
  correctCount: number;
  wrongCount: number;
  source: 'exam' | 'task' | 'combined';
  trend?: 'improving' | 'declining' | 'stable';
}

interface SubjectMasteryAnalysisProps {
  studentId: string;
  masteryData: SubjectMasteryData[];
}

export function SubjectMasteryAnalysis({ studentId, masteryData }: SubjectMasteryAnalysisProps) {
  // Group data by subject
  const groupedBySubject = masteryData.reduce((acc, item) => {
    if (!acc[item.subject]) {
      acc[item.subject] = [];
    }
    acc[item.subject].push(item);
    return acc;
  }, {} as Record<string, SubjectMasteryData[]>);

  // Calculate overall statistics
  const overallSuccessRate = masteryData.length > 0 
    ? masteryData.reduce((sum, item) => sum + item.successRate, 0) / masteryData.length 
    : 0;

  const weakTopics = masteryData.filter(item => item.successRate < 50);
  const strongTopics = masteryData.filter(item => item.successRate >= 70);

  const getSuccessColor = (rate: number) => {
    if (rate >= 80) return "bg-green-600";
    if (rate >= 60) return "bg-blue-600";
    if (rate >= 40) return "bg-yellow-600";
    return "bg-red-600";
  };

  const getSuccessStatus = (rate: number) => {
    if (rate >= 80) return { text: "Mükemmel", icon: CheckCircle2, color: "text-green-600" };
    if (rate >= 60) return { text: "İyi", icon: TrendingUp, color: "text-blue-600" };
    if (rate >= 40) return { text: "Orta", icon: AlertCircle, color: "text-yellow-600" };
    return { text: "Zayıf", icon: TrendingDown, color: "text-red-600" };
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Genel Başarı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{overallSuccessRate.toFixed(1)}%</div>
            <Progress value={overallSuccessRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Toplam Konu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{masteryData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Zayıf Konular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{weakTopics.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Güçlü Konular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{strongTopics.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Breakdown */}
      {Object.entries(groupedBySubject).map(([subject, topics]) => (
        <Card key={subject}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{subject}</span>
              <Badge variant="outline">{topics.length} konu</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topics.map((topic, index) => {
                const status = getSuccessStatus(topic.successRate);
                const StatusIcon = status.icon;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className="font-medium text-gray-900">{topic.topic}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {topic.correctCount}/{topic.totalAttempts} doğru
                        </span>
                        <Badge className={status.color} variant="outline">
                          {status.text}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={topic.successRate} className={getSuccessColor(topic.successRate)} />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Başarı: %{topic.successRate.toFixed(1)}</span>
                      <span className="capitalize">{topic.source === 'combined' ? 'Deneme + Görev' : topic.source === 'exam' ? 'Deneme' : 'Görev'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Recommendations */}
      {weakTopics.length > 0 && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-900 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Öneriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-orange-800">
              {weakTopics.slice(0, 3).map((topic, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-1">•</span>
                  <span>
                    <strong>{topic.subject} - {topic.topic}:</strong> Başarı oranı %{topic.successRate.toFixed(1)}. 
                    Önce konu tekrarı (REVIEW) görevi önerilir.
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}