"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GraduationCap, Calendar, Target, TrendingUp, Clock, BookOpen, Award } from "lucide-react";

interface StudentReportTemplateProps {
  studentName: string;
  targetUniversity?: string | null;
  targetMajor?: string | null;
  reportType: 'weekly' | 'monthly';
  reportDate: string;
  aiSummary: string;
  currentScore: number | null;
  targetScore: number | null;
  exams: any[];
  completedTasks: any[];
  pomodoroData: {
    totalMinutes: number;
    totalSessions: number;
    topSubjects: { subject: string; minutes: number }[];
  };
  subjectAnalysis: any[];
}

export function StudentReportTemplate({
  studentName,
  targetUniversity,
  targetMajor,
  reportType,
  reportDate,
  aiSummary,
  currentScore,
  targetScore,
  exams,
  completedTasks,
  pomodoroData,
  subjectAnalysis
}: StudentReportTemplateProps) {
  
  const totalExams = exams.length;
  const averageNet = totalExams > 0 ? exams.reduce((sum, e) => sum + (e.totalNet || 0), 0) / totalExams : 0;
  const totalTasks = completedTasks.length;
  const totalCorrect = completedTasks.reduce((sum, t) => sum + (t.completedCorrect || 0), 0);
  const totalWrong = completedTasks.reduce((sum, t) => sum + (t.completedWrong || 0), 0);
  const totalEmpty = completedTasks.reduce((sum, t) => sum + (t.completedEmpty || 0), 0);
  const taskSuccessRate = totalTasks > 0 ? (totalCorrect / (totalCorrect + totalWrong + totalEmpty)) * 100 : 0;
  const totalPomodoroHours = Math.round(pomodoroData.totalMinutes / 25);

  return (
    <div className="bg-white p-8 min-h-screen font-sans" id="report-template">
      {/* Header */}
      <div className="border-b-4 border-blue-600 pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">ATA VISION</h1>
            <p className="text-gray-600">Eğitim ve Yurt Dışı Danışmanlık</p>
          </div>
          <div className="text-right">
            <Badge className="bg-blue-600 text-white mb-2">
              {reportType === 'weekly' ? 'Haftalık Rapor' : 'Aylık Rapor'}
            </Badge>
            <p className="text-sm text-gray-600">{reportDate}</p>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Öğrenci</span>
            </div>
            <p className="font-semibold text-lg">{studentName}</p>
          </div>
          {targetUniversity && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">Hedef Üniversite</span>
              </div>
              <p className="font-semibold">{targetUniversity}</p>
              {targetMajor && <p className="text-sm text-gray-600">{targetMajor}</p>}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Skor</span>
            </div>
            <p className="font-semibold">
              {currentScore !== null ? currentScore.toFixed(1) : '-'} / {targetScore !== null ? targetScore.toFixed(1) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* AI Executive Summary */}
      <Card className="mb-8 border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <Award className="w-5 h-5" />
            AI Koçluk Özeti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Deneme Sınavı</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totalExams}</p>
            <p className="text-xs text-gray-500">Ortalama: {averageNet.toFixed(1)} net</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Tamamlanan Görev</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{totalTasks}</p>
            <p className="text-xs text-gray-500">Başarı: %{taskSuccessRate.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Çalışma Süresi</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{totalPomodoroHours}</p>
            <p className="text-xs text-gray-500">Pomodoro</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Skor Değişimi</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {exams.length >= 2 ? (
                exams[exams.length - 1].totalNet - exams[0].totalNet > 0 ? '+' : ''
              ) : ''}
              {exams.length >= 2 ? (exams[exams.length - 1].totalNet - exams[0].totalNet).toFixed(1) : '-'}
            </p>
            <p className="text-xs text-gray-500">Net artış/azalış</p>
          </CardContent>
        </Card>
      </div>

      {/* Exam Results Table */}
      {exams.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Deneme Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Toplam Net</TableHead>
                  <TableHead>Dersler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.map((exam, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(exam.date).toLocaleDateString('tr-TR')}</TableCell>
                    <TableCell className="font-semibold">{exam.totalNet?.toFixed(1) || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {exam.subjectResults?.slice(0, 3).map((sr: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {sr.subjectName}: {sr.net?.toFixed(1) || '-'}
                          </Badge>
                        ))}
                        {exam.subjectResults?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{exam.subjectResults.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Subject Analysis */}
      {subjectAnalysis.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Konu Bazlı Performans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectAnalysis.slice(0, 6).map((analysis, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{analysis.subject} - {analysis.topic}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {analysis.proficiency === 'EXCELLENT' && 'Mükemmel'}
                      {analysis.proficiency === 'GOOD' && 'İyi'}
                      {analysis.proficiency === 'MEDIUM' && 'Orta'}
                      {analysis.proficiency === 'WEAK' && 'Zayıf'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className={`h-full ${
                          analysis.progressPercent >= 80 ? 'bg-green-500' :
                          analysis.progressPercent >= 60 ? 'bg-blue-500' :
                          analysis.progressPercent >= 40 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${analysis.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-12 text-right">%{analysis.progressPercent}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Focus */}
      {pomodoroData.topSubjects.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Çalışma Odaklanması
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pomodoroData.topSubjects.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.subject}</span>
                  <div className="flex items-center gap-2">
                    <div className="relative h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className="h-full bg-purple-500"
                        style={{ width: `${(item.minutes / pomodoroData.totalMinutes) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">{Math.round(item.minutes / 25)} pdk</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="border-t pt-6 mt-8 text-center text-sm text-gray-500">
        <p>Bu rapor ATA VISION Eğitim ve Yurt Dışı Danışmanlık sistem tarafından otomatik olarak oluşturulmuştur.</p>
        <p className="mt-1">Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
      </div>
    </div>
  );
}