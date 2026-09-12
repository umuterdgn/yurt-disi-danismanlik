"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AddAdvancedExamDialog } from "@/components/advanced-exam-dialog";
import { ExamErrorAnalysis } from "@/components/exam-error-analysis";
import { MasteryMap } from "@/components/mastery-map";
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SubjectResult {
  id: string;
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  questionResults?: {
    id: string;
    topic: string;
    subTopic?: string;
    isCorrect: boolean;
    errorType?: string;
    timeSpent: number;
  }[];
}

interface ExamResult {
  id: string;
  examName?: string;
  title?: string;
  examDate?: string;
  date?: string;
  actualScore?: number | null;
  totalNet?: number | null;
  targetScore?: number;
  totalScore?: number | null;
  change: number;
  examType?: string;
  studentProfile: {
    user: {
      name: string;
    };
  };
  subjectResults?: SubjectResult[];
}

interface SubjectAnalysis {
  id: string;
  subject: string;
  topic: string;
  proficiency: string;
  progressPercent: number;
  studentProfile: {
    user: {
      name: string;
    };
  };
}

interface ExamsClientProps {
  examResults: ExamResult[];
  subjectAnalysis: SubjectAnalysis[];
  students: { id: string; name: string }[];
  userName: string;
}

export function ExamsClient({ examResults, subjectAnalysis, students, userName }: ExamsClientProps) {
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);

  const getProficiencyBadge = (level: string) => {
    switch (level) {
      case 'WEAK':
        return <Badge className="bg-red-100 text-red-700">Zayıf</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-700">Orta</Badge>;
      case 'GOOD':
        return <Badge className="bg-blue-100 text-blue-700">İyi</Badge>;
      case 'EXCELLENT':
        return <Badge className="bg-green-100 text-green-700">Mükemmel</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-4 h-4 mr-1" />
          +{change.toFixed(1)}
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingDown className="w-4 h-4 mr-1" />
          {change.toFixed(1)}
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <Minus className="w-4 h-4 mr-1" />
          0
        </div>
      );
    }
  };

  const averageScore = examResults.length > 0 
    ? (examResults.reduce((sum, e) => sum + (e.actualScore || e.totalNet || 0), 0) / examResults.length).toFixed(1)
    : 0;

  const improvementCount = examResults.filter(e => e.change > 0).length;

  const chartData = examResults.slice(-20).map((e) => ({
    name: e.studentProfile.user.name,
    date: new Date(e.examDate || e.date).toLocaleDateString('tr-TR'),
    score: e.actualScore || e.totalNet || 0,
    target: e.targetScore || e.totalScore || 0
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Deneme & Analiz</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Hoş Geldiniz, {userName}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Toplam Deneme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{examResults.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Ortalama Net</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{averageScore}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">İyileşme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-purple-600">{improvementCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Konu Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl md:text-3xl font-bold text-orange-600">{subjectAnalysis.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Öğrenci Gelişim Grafiği</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300} minHeight={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Gerçek Net" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#10b981" name="Hedef Net" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exam Results Table */}
        <Card className="mb-6 md:mb-8">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Deneme Sonuçları</CardTitle>
            <AddAdvancedExamDialog students={students} />
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Öğrenci</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Deneme Adı</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Tarih</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Toplam Net</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Tür</TableHead>
                    <TableHead className="text-gray-600 text-xs md:text-sm">Değişim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {examResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500 text-sm">
                        Henüz deneme sonucu bulunmuyor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    examResults.map((exam) => (
                      <TableRow 
                        key={exam.id} 
                        className={selectedExam?.id === exam.id ? 'bg-purple-50' : 'hover:bg-gray-50'}
                        onClick={() => setSelectedExam(selectedExam?.id === exam.id ? null : exam)}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell className="font-medium text-gray-900 text-xs md:text-sm">
                          {exam.studentProfile?.user?.name || '-'}
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">{exam.examName || exam.title}</TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">
                          {new Date(exam.examDate || exam.date).toLocaleDateString('tr-TR')}
                        </TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">{exam.actualScore ?? exam.totalNet ?? '-'}</TableCell>
                        <TableCell className="text-gray-600 text-xs md:text-sm">{(exam as any).examType || '-'}</TableCell>
                        <TableCell className="text-xs md:text-sm">{getChangeIndicator(exam.change)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Subject Analysis */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Konu Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectAnalysis.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">Henüz konu analizi bulunmuyor.</p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {subjectAnalysis.map((analysis) => (
                  <div key={analysis.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 md:p-4 border rounded-lg gap-3">
                    <div className="flex-1 w-full">
                      <p className="font-medium text-gray-900 text-sm md:text-base">{analysis.studentProfile.user.name}</p>
                      <p className="text-xs md:text-sm text-gray-600">{analysis.subject} - {analysis.topic}</p>
                    </div>
                    <div className="flex items-center space-x-3 md:space-x-4 w-full md:w-auto">
                      <div className="text-right">
                        <p className="text-xs md:text-sm text-gray-600">İlerleme</p>
                        <p className="font-semibold text-sm md:text-base">{analysis.progressPercent}%</p>
                      </div>
                      {getProficiencyBadge(analysis.proficiency)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mastery Map for All Exams */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Genel Konu Hakimiyet Haritası</CardTitle>
          </CardHeader>
          <CardContent>
            <MasteryMap exams={examResults as any} />
          </CardContent>
        </Card>

        {/* Selected Exam Error Analysis */}
        {selectedExam && (
          <div className="mb-6 md:mb-8">
            <ExamErrorAnalysis 
              exam={selectedExam as any} 
              studentId={selectedExam.studentProfile.id} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
