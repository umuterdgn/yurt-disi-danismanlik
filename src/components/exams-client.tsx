"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AddAdvancedExamDialog } from "@/components/advanced-exam-dialog";
import { ExamErrorAnalysis } from "@/components/exam-error-analysis";
import { MasteryMap } from "@/components/mastery-map";
import { HolisticAnalysis } from "@/components/holistic-analysis";
import { BehavioralAnalysisBanner } from "@/components/behavioral-analysis-banner";
import { TrendingUp, TrendingDown, Minus, BarChart3, Brain, AlertCircle, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    result: string;
    errorType?: string;
    questionStructure?: string;
    difficultyLevel?: string;
    isBlank?: boolean;
    interdisciplinaryTag?: string;
    timeSpent: number;
    questionNumber?: number;
    markedAnswer?: string;
    correctAnswer?: string;
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
  students: { id: string; name: string; grade: string }[];
  userName: string;
}

const ERROR_TYPES = [
  { value: 'KNOWLEDGE_GAP', label: 'Bilgi Eksikliği', icon: <Brain className="w-3 h-3" />, color: 'bg-red-100 text-red-700' },
  { value: 'LOGIC_ERROR', label: 'Mantık Hatası', icon: <AlertCircle className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
  { value: 'CALCULATION_ERROR', label: 'İşlem Hatası', icon: <XCircle className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700' },
];

const QUESTION_STRUCTURE_TYPES = [
  { value: 'YENI_NESIL', label: 'Yeni Nesil', icon: '🎯', color: 'bg-blue-100 text-blue-700' },
  { value: 'KLASIK', label: 'Klasik', icon: '📝', color: 'bg-gray-100 text-gray-700' },
  { value: 'ONCULLU', label: 'Öncüllü', icon: '📋', color: 'bg-teal-100 text-teal-700' },
  { value: 'GRAFIK_TABLO', label: 'Grafik/Tablo', icon: '📊', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'PARAGRAF', label: 'Paragraf', icon: '📖', color: 'bg-amber-100 text-amber-700' },
];

const DIFFICULTY_LEVELS = [
  { value: 'KOLAY', label: 'Kolay', color: 'bg-green-100 text-green-700' },
  { value: 'ORTA', label: 'Orta', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ZOR', label: 'Zor', color: 'bg-red-100 text-red-700' },
  { value: 'AYIRT_EDICI', label: 'Ayırt Edici', color: 'bg-purple-100 text-purple-700' },
];

const getErrorTypeBadge = (errorType?: string) => {
  if (!errorType) return null;
  const errorTypeConfig = ERROR_TYPES.find(et => et.value === errorType);
  if (!errorTypeConfig) return null;
  
  return (
    <Badge className={`${errorTypeConfig.color} text-xs`}>
      {errorTypeConfig.icon}
      <span className="ml-1">{errorTypeConfig.label}</span>
    </Badge>
  );
};

const getQuestionStructureBadge = (questionStructure?: string) => {
  if (!questionStructure) return null;
  const structureConfig = QUESTION_STRUCTURE_TYPES.find(qst => qst.value === questionStructure);
  if (!structureConfig) return null;
  
  return (
    <Badge className={`${structureConfig.color} text-xs`}>
      <span className="mr-1">{structureConfig.icon}</span>
      <span>{structureConfig.label}</span>
    </Badge>
  );
};

const getDifficultyBadge = (difficultyLevel?: string) => {
  if (!difficultyLevel) return null;
  const difficultyConfig = DIFFICULTY_LEVELS.find(dl => dl.value === difficultyLevel);
  if (!difficultyConfig) return null;
  
  return (
    <Badge className={`${difficultyConfig.color} text-xs`}>
      {difficultyConfig.label}
    </Badge>
  );
};

export function ExamsClient({ examResults, subjectAnalysis, students, userName }: ExamsClientProps) {
  const [selectedExam, setSelectedExam] = useState<ExamResult | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');

  // Behavioral Analysis for selected exam
  const behavioralAnalysis = useMemo(() => {
    if (!selectedExam || !selectedExam.subjectResults) return null;

    const allQuestionResults = selectedExam.subjectResults.flatMap(sr => sr.questionResults || []);
    if (allQuestionResults.length === 0) return null;

    const insights: string[] = [];
    const totalQuestions = allQuestionResults.length;

    // Fatigue Analysis
    const wrongAnswers = allQuestionResults.filter(q => q.result === 'WRONG');
    if (wrongAnswers.length > 0) {
      const lastQuarterStart = Math.ceil(totalQuestions * 0.75);
      const wrongInLastQuarter = wrongAnswers.filter(q => (q.questionNumber || 0) >= lastQuarterStart);
      const wrongInFirstThreeQuarters = wrongAnswers.filter(q => (q.questionNumber || 0) < lastQuarterStart);
      
      if (wrongInLastQuarter.length > wrongInFirstThreeQuarters.length * 1.5) {
        insights.push('Mental Fatigue / Odak Kaybı: Hatalar sınavın son çeyreğinde yoğunlaşıyor');
      }
    }

    // Blank Behavior Analysis
    const blankQuestions = allQuestionResults.filter(q => q.isBlank || q.result === 'EMPTY');
    if (blankQuestions.length > 0) {
      const lastQuarterStart = Math.ceil(totalQuestions * 0.75);
      const blankInLastQuarter = blankQuestions.filter(q => (q.questionNumber || 0) >= lastQuarterStart);
      const blankInFirstThreeQuarters = blankQuestions.filter(q => (q.questionNumber || 0) < lastQuarterStart);
      
      if (blankInLastQuarter.length > blankInFirstThreeQuarters.length * 2) {
        insights.push('Zaman Yönetimi Problemi: Boş sorular sınavın sonuna blok halinde yığılmış');
      } else if (blankInFirstThreeQuarters.length > 0) {
        insights.push('Özgüven/Konu Eksikliği: Boş sorular sınav boyunca aralıklı');
      }
    }

    // Interdisciplinary Gap Analysis
    const interdisciplinaryGaps = allQuestionResults.filter(q => q.interdisciplinaryTag);
    if (interdisciplinaryGaps.length > 0) {
      const gapSubjects = [...new Set(interdisciplinaryGaps.map(q => q.interdisciplinaryTag))];
      insights.push(`Disiplinlerarası Eksiklik: ${gapSubjects.join(', ')}`);
    }

    // Difficulty Level Analysis
    const difficultyDistribution = wrongAnswers.reduce((acc, q) => {
      if (q.difficultyLevel) {
        acc[q.difficultyLevel] = (acc[q.difficultyLevel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    if (difficultyDistribution['ZOR'] > 0 || difficultyDistribution['AYIRT_EDICI'] > 0) {
      insights.push('Zor Soru Performansı: Gelişim alanı zor sorularda yoğunlaşmış');
    }

    return {
      insights,
      fatiguePattern: insights.find(i => i.includes('Fatigue')) || undefined,
      blankBehavior: insights.find(i => i.includes('Zaman') || i.includes('Özgüven')) || undefined
    };
  }, [selectedExam]);

  // Filter data based on selected grade
  const filteredStudents = selectedGrade === 'all'
    ? students
    : students.filter(student => student.grade === selectedGrade);

  const filteredStudentIds = new Set(filteredStudents.map(s => s.id));

  // Filter exams based on grade, student, and exam type
  const filteredExamResults = examResults.filter(exam => {
    const studentId = (exam as any).studentProfile?.id;
    const examType = (exam as any).examType || exam.examType;
    
    // Filter by grade
    if (!studentId || !filteredStudentIds.has(studentId)) return false;
    
    // Filter by student
    if (selectedStudent !== 'all' && studentId !== selectedStudent) return false;
    
    // Filter by exam type
    if (selectedExamType !== 'all' && examType !== selectedExamType) return false;
    
    return true;
  });

  // Filter subject analysis based on grade and student
  const filteredSubjectAnalysis = subjectAnalysis.filter(analysis => {
    const studentId = (analysis as any).studentProfile?.id;
    
    // Filter by grade
    if (!studentId || !filteredStudentIds.has(studentId)) return false;
    
    // Filter by student
    if (selectedStudent !== 'all' && studentId !== selectedStudent) return false;
    
    return true;
  });

  // Chart data: Only for selected student and exam type, sorted by date
  const getChartData = () => {
    if (selectedStudent === 'all' || selectedExamType === 'all') {
      return []; // Return empty if no specific selection
    }

    const studentExams = filteredExamResults.filter(exam => {
      const studentId = (exam as any).studentProfile?.id;
      const examType = (exam as any).examType || exam.examType;
      return studentId === selectedStudent && examType === selectedExamType;
    });

    // Sort by date (oldest to newest for chart)
    const sortedExams = [...studentExams].sort((a, b) => {
      const dateA = new Date(a.examDate || a.date || Date.now());
      const dateB = new Date(b.examDate || b.date || Date.now());
      return dateA.getTime() - dateB.getTime();
    });

    return sortedExams.map((e) => ({
      name: e.studentProfile.user.name,
      date: new Date(e.examDate || e.date || Date.now()).toLocaleDateString('tr-TR'),
      score: e.actualScore || e.totalNet || 0,
      target: e.targetScore || e.totalScore || 0
    }));
  };

  const chartData = getChartData();

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

  const averageScore = filteredExamResults.length > 0
    ? (filteredExamResults.reduce((sum, e) => sum + (e.actualScore || e.totalNet || 0), 0) / filteredExamResults.length).toFixed(1)
    : 0;

  const improvementCount = filteredExamResults.filter(e => e.change > 0).length;

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
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{filteredExamResults.length}</div>
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
              <div className="text-2xl md:text-3xl font-bold text-orange-600">{filteredSubjectAnalysis.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Chart */}
        <Card className="mb-6 md:mb-8">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <CardTitle className="text-lg md:text-xl">Öğrenci Gelişim Grafiği</CardTitle>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
              <div className="w-full md:w-48">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Öğrenci Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sınav Türü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınavlar</SelectItem>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                    <SelectItem value="YKS">YKS</SelectItem>
                    <SelectItem value="LGS">LGS</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-600 text-sm">Gelişim grafiğini görüntülemek için lütfen bir öğrenci ve sınav türü seçin.</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>

        {/* Exam Results Table */}
        <Card className="mb-6 md:mb-8">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Deneme Sonuçları</CardTitle>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sınıf" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınıflar</SelectItem>
                    <SelectItem value="9">9. Sınıf</SelectItem>
                    <SelectItem value="10">10. Sınıf</SelectItem>
                    <SelectItem value="11">11. Sınıf</SelectItem>
                    <SelectItem value="12">12. Sınıf</SelectItem>
                    <SelectItem value="Mezun">Mezun</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Öğrenci" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                    {filteredStudents.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedExamType} onValueChange={setSelectedExamType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Sınav Türü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sınavlar</SelectItem>
                    <SelectItem value="TYT">TYT</SelectItem>
                    <SelectItem value="AYT">AYT</SelectItem>
                    <SelectItem value="YKS">YKS</SelectItem>
                    <SelectItem value="LGS">LGS</SelectItem>
                    <SelectItem value="Diğer">Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <AddAdvancedExamDialog students={filteredStudents} />
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
                  {filteredExamResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500 text-sm">
                        Henüz deneme sonucu bulunmuyor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExamResults.map((exam) => (
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
                          {new Date(exam.examDate || exam.date || Date.now()).toLocaleDateString('tr-TR')}
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
            {filteredSubjectAnalysis.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">Henüz konu analizi bulunmuyor.</p>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {filteredSubjectAnalysis.map((analysis) => (
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
            <MasteryMap exams={filteredExamResults as any} subjectAnalysis={filteredSubjectAnalysis} />
          </CardContent>
        </Card>

        {/* Holistic Analysis - Integrated Performance */}
        <Card className="mb-6 md:mb-8">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl font-semibold text-gray-900">Bütünleşik Performans Analizi</CardTitle>
          </CardHeader>
          <CardContent>
            <HolisticAnalysis subjectAnalysis={filteredSubjectAnalysis} />
          </CardContent>
        </Card>

        {/* Selected Exam Error Analysis */}
        {selectedExam && (selectedExam as any).studentProfile?.id && (
          <div className="mb-6 md:mb-8">
            {/* Behavioral Analysis Banner */}
            {behavioralAnalysis && behavioralAnalysis.insights.length > 0 && (
              <BehavioralAnalysisBanner
                insights={behavioralAnalysis.insights}
                fatiguePattern={behavioralAnalysis.fatiguePattern}
                blankBehavior={behavioralAnalysis.blankBehavior}
              />
            )}
            
            <ExamErrorAnalysis 
              exam={selectedExam as any} 
              studentId={(selectedExam as any).studentProfile.id} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
