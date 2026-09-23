"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { CURRICULUM } from "@/lib/constants/curriculum";

interface QuestionTypeAnalysis {
  questionType: string;
  count: number;
  wrongCount: number;
  emptyCount: number;
}

interface WorksheetUploadDialogProps {
  studentId?: string;
  students?: { id: string; name: string }[];
  trigger?: React.ReactNode;
}

export function WorksheetUploadDialog({ studentId, students = [], trigger }: WorksheetUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "");
  const [examType, setExamType] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === files.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudentId || !examType || !subject || !topic || images.length === 0) {
      setError("Lütfen öğrenci, sınav türü, ders, konu seçin ve en az bir görsel yükleyin.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/ocr-worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          subject,
          topic,
          images
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Yükleme başarısız");
      }

      setResult(data);
      setImages([]);
      setSelectedStudentId(studentId || "");
      setExamType("");
      setSubject("");
      setTopic("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getQuestionTypeSummary = (analysis: QuestionTypeAnalysis[]) => {
    if (!analysis || analysis.length === 0) return null;

    return analysis.map((item) => (
      <div key={item.questionType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{item.questionType}</Badge>
          <span className="text-sm text-gray-600">Toplam: {item.count}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-red-600">Yanlış: {item.wrongCount}</span>
          <span className="text-sm text-orange-600">Boş: {item.emptyCount}</span>
        </div>
      </div>
    ));
  };

  const getSubjectsForExamType = (examType: string) => {
    return Object.keys(CURRICULUM[examType] || {});
  };

  const getTopicsForSubject = (examType: string, subject: string) => {
    return CURRICULUM[examType]?.[subject] || [];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full">
            <FileText className="w-4 h-4 mr-2" />
            📄 Yaprak Test / Ödev Yükle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Yaprak Test / Ödev Yükle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!result ? (
            <>
              {/* Hierarchical Form Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Student Selection - Full Width */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="student">Öğrenci Seçin</Label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger id="student">
                      <SelectValue placeholder="Öğrenci seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.length > 0 ? (
                        students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value={studentId || ""}>
                          {studentId ? "Mevcut Öğrenci" : "Öğrenci seçin"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="examType">Sınav Türü / Sınıf</Label>
                  <Select
                    value={examType}
                    onValueChange={(value) => {
                      setExamType(value);
                      setSubject("");
                      setTopic("");
                    }}
                    disabled={!selectedStudentId}
                  >
                    <SelectTrigger id="examType">
                      <SelectValue placeholder="Sınav türü seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CURRICULUM).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Ders Seçin</Label>
                  <Select
                    value={subject}
                    onValueChange={(value) => {
                      setSubject(value);
                      setTopic("");
                    }}
                    disabled={!examType}
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Ders seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {examType && getSubjectsForExamType(examType).map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Topic Selection - Full Width */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="topic">Konu Seçin</Label>
                  <Select
                    value={topic}
                    onValueChange={setTopic}
                    disabled={!subject}
                  >
                    <SelectTrigger id="topic">
                      <SelectValue placeholder="Konu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {examType && subject && getTopicsForSubject(examType, subject).map((top) => (
                        <SelectItem key={top} value={top}>
                          {top}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Upload - Full Width */}
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="images">Test Görselleri</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer min-h-[200px] flex flex-col items-center justify-center">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                    <label htmlFor="images" className="cursor-pointer w-full">
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm text-gray-600 font-medium">
                        Görselleri yüklemek için tıklayın veya sürükleyin
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        PNG, JPG, JPEG (Maks 10 görsel)
                      </p>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        {images.length} görsel seçildi
                      </p>
                      <div className="grid grid-cols-5 gap-3">
                        {images.map((img, index) => (
                          <div key={index} className="relative aspect-square">
                            <img
                              src={img}
                              alt={`Yüklenen görsel ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={uploading || !selectedStudentId || !examType || !subject || !topic || images.length === 0}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    İşleniyor...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Testi Analiz Et
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Success Result */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Analiz Tamamlandı!</p>
                    <p className="text-sm text-green-700">
                      {result.subject} - {result.topic}
                    </p>
                  </div>
                </div>

                {/* Score Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Genel Sonuç</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{result.correct}</p>
                        <p className="text-sm text-green-700">Doğru</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{result.wrong}</p>
                        <p className="text-sm text-red-700">Yanlış</p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{result.empty}</p>
                        <p className="text-sm text-orange-700">Boş</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Type Analysis */}
                {result.questionTypeAnalysis && result.questionTypeAnalysis.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Soru Tipi Analizi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {getQuestionTypeSummary(result.questionTypeAnalysis)}
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900 font-medium mb-1">Analiz Özeti:</p>
                        <p className="text-sm text-blue-700">
                          {result.questionTypeAnalysis.map((item: QuestionTypeAnalysis) => 
                            `${item.wrongCount} adet ${item.questionType} sorusunu yanlış yaptınız${item.emptyCount > 0 ? `, ${item.emptyCount} adet boş bıraktınız` : ''}`
                          ).join(', ')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                  <div className="space-y-2">
                    {result.warnings.map((warning: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-700">{warning}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Close Button */}
                <Button onClick={() => { setOpen(false); setResult(null); }} className="w-full">
                  Kapat
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}