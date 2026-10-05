"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertCircle, TrendingDown, Brain, XCircle } from "lucide-react";
import { toast } from "sonner";
import { updateQuestionErrorType } from "@/actions/exam-error-analysis";

interface SubjectResult {
  id: string;
  subjectName: string;
  correct: number;
  wrong: number;
  empty: number;
  net: number;
  questionResults?: QuestionResult[];
}

interface QuestionResult {
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
}

interface Exam {
  id: string;
  title: string;
  date: Date;
  totalNet: number;
  totalScore: number;
  examType: string;
  subjectResults: SubjectResult[];
}

interface ExamErrorAnalysisProps {
  exam: Exam;
  studentId: string;
}

const ERROR_TYPES = [
  { value: 'KNOWLEDGE_GAP', label: 'Bilgi Eksikliği', icon: <Brain className="w-4 h-4" />, color: 'bg-red-100 text-red-700' },
  { value: 'LOGIC_ERROR', label: 'Mantık Hatası', icon: <AlertCircle className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700' },
  { value: 'CALCULATION_ERROR', label: 'İşlem Hatası', icon: <XCircle className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700' },
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

export function ExamErrorAnalysis({ exam, studentId }: ExamErrorAnalysisProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const handleErrorTypeChange = async (questionResultId: string, errorType: string) => {
    setLoading(true);
    try {
      const result = await updateQuestionErrorType(questionResultId, errorType);
      if (result.success) {
        toast.success("Hata tipi başarıyla güncellendi");
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        toast.error(result.error || "Bir hata oluştu");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getErrorTypeBadge = (errorType?: string) => {
    if (!errorType) return null;
    const errorTypeConfig = ERROR_TYPES.find(et => et.value === errorType);
    if (!errorTypeConfig) return null;
    
    return (
      <Badge className={errorTypeConfig.color}>
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
      <Badge className={structureConfig.color}>
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
      <Badge className={difficultyConfig.color}>
        {difficultyConfig.label}
      </Badge>
    );
  };

  const getSubjectWithWrongAnswers = () => {
    return exam.subjectResults.filter(subject => subject.wrong > 0);
  };

  const getQuestionResultsForSubject = (subjectResult: SubjectResult) => {
    // Use real question results from database
    const questionResults = subjectResult.questionResults || [];
    
    // Filter for WRONG answers only
    return questionResults.filter(q => q.result === 'WRONG');
  };

  const subjectsWithWrongAnswers = getSubjectWithWrongAnswers();

  if (subjectsWithWrongAnswers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
            Hata Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>Bu denemede yanlış soru bulunmuyor.</p>
            <p className="text-sm mt-2">Harika gidiyorsun! 🎉</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 mr-2 text-red-500" />
            Hata Analizi
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Hata Tiplerini Ata
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-w-[95vw] w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Yanlış Soru Hata Analizi</DialogTitle>
                <DialogDescription>
                  Yanlış sorular için hata tipleri atayarak analizi derinleştirin.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Subject Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Ders Seçin</label>
                  <Select value={selectedSubject || undefined} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ders seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectsWithWrongAnswers.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subjectName} ({subject.wrong} yanlış)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Question Results for Selected Subject */}
                {selectedSubject && (() => {
                  const subject = exam.subjectResults.find(s => s.id === selectedSubject);
                  if (!subject) return null;

                  const questionResults = getQuestionResultsForSubject(subject);

                  return (
                    <div className="space-y-4">
                      <h3 className="font-semibold">{subject.subjectName} - Yanlış Sorular</h3>
                      
                      {questionResults.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          Bu ders için henüz soru detayı yok.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {questionResults.map((question) => (
                            <div key={question.id} className="border rounded-lg p-4 bg-red-50">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-semibold">Soru {question.questionNumber || '-'}</span>
                                    {getDifficultyBadge(question.difficultyLevel)}
                                    {getQuestionStructureBadge(question.questionStructure)}
                                    {getErrorTypeBadge(question.errorType)}
                                  </div>
                                  <h4 className="font-medium">{question.topic}</h4>
                                  {question.subTopic && (
                                    <p className="text-sm text-gray-600">{question.subTopic}</p>
                                  )}
                                  {question.interdisciplinaryTag && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
                                      <AlertCircle className="w-3 h-3" />
                                      <span>Kök Neden: {question.interdisciplinaryTag}</span>
                                    </div>
                                  )}
                                  {question.markedAnswer && question.correctAnswer && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      İşaretlenen: {question.markedAnswer} | Doğru: {question.correctAnswer}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right ml-4">
                                  <span className="text-xs text-gray-500">
                                    {Math.floor(question.timeSpent / 60)}d {question.timeSpent % 60}s
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-red-200">
                                <div className="flex items-center gap-2">
                                  <label className="text-sm font-medium">Hata Tipi:</label>
                                  <Select
                                    value={question.errorType || ''}
                                    onValueChange={(value) => handleErrorTypeChange(question.id, value)}
                                    disabled={loading}
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="Seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ERROR_TYPES.map((errorType) => (
                                        <SelectItem key={errorType.value} value={errorType.value}>
                                          <div className="flex items-center">
                                            {errorType.icon}
                                            <span className="ml-2">{errorType.label}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>

        {/* Summary of wrong answers by subject */}
        <div className="space-y-3">
          {subjectsWithWrongAnswers.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-3">
                <Badge variant="destructive">{subject.wrong}</Badge>
                <span className="font-medium">{subject.subjectName}</span>
              </div>
              <div className="text-sm text-gray-600">
                Net: {subject.net.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}