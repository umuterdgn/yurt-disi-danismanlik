"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTask } from "@/actions/add-task";
import { getCurriculumSubjects, getCurriculumTopics, getCurriculumQuestionTypes } from "@/actions/get-curriculum";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddTaskDialogProps {
  students: { id: string; name: string }[];
  studentId?: string; // Optional for auto-selection
}

export function AddTaskDialog({ students, studentId }: AddTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState("");
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [questionTypes, setQuestionTypes] = useState<any[]>([]);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);

  // Load curriculum data when dialog opens
  useEffect(() => {
    if (open) {
      loadCurriculumData();
    }
  }, [open]);

  const loadCurriculumData = async () => {
    setLoadingCurriculum(true);
    try {
      const subjectsResult = await getCurriculumSubjects();
      if (subjectsResult.success && subjectsResult.subjects) {
        setSubjects(subjectsResult.subjects);
      }
    } catch (error) {
      console.error('Error loading curriculum:', error);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  // Load topics when subject changes
  useEffect(() => {
    if (selectedSubject) {
      loadTopics(selectedSubject);
    } else {
      setTopics([]);
      setQuestionTypes([]);
    }
  }, [selectedSubject]);

  // Load question types when topic changes
  useEffect(() => {
    if (selectedTopic) {
      loadQuestionTypes(selectedTopic);
    } else {
      setQuestionTypes([]);
    }
  }, [selectedTopic]);

  const loadTopics = async (subjectId: string) => {
    try {
      const topicsResult = await getCurriculumTopics(subjectId);
      if (topicsResult.success && topicsResult.topics) {
        setTopics(topicsResult.topics);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadQuestionTypes = async (topicId: string) => {
    try {
      const qtResult = await getCurriculumQuestionTypes(topicId);
      if (qtResult.success && qtResult.questionTypes) {
        setQuestionTypes(qtResult.questionTypes);
      }
    } catch (error) {
      console.error('Error loading question types:', error);
    }
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Add curriculum IDs to form data
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      formData.append('subject', subject?.name || '');
      formData.append('subjectId', selectedSubject);
    }
    if (selectedTopic) {
      const topic = topics.find(t => t.id === selectedTopic);
      formData.append('topic', topic?.name || '');
      formData.append('topicId', selectedTopic);
    }
    if (selectedQuestionType) {
      formData.append('questionTypeId', selectedQuestionType);
    }
    
    const result = await addTask(formData);
    
    if (result.success) {
      toast.success("Görev başarıyla eklendi!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Görev Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Görev Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir çalışma görevi oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="studentProfileId" className="md:text-right">
                Öğrenci
              </Label>
              <Select name="studentProfileId" required defaultValue={studentId}>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="title" className="md:text-right">
                Görev Başlığı
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Örn: Matematik çalışması"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="subject" className="md:text-right">
                Ders
              </Label>
              <Select 
                name="subject" 
                required 
                disabled={loadingCurriculum}
                onValueChange={(value) => {
                  setSelectedSubject(value);
                  setSelectedTopic('');
                  setSelectedQuestionType('');
                }}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder={loadingCurriculum ? "Yükleniyor..." : "Ders seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.displayName || subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="topic" className="md:text-right">
                Konu
              </Label>
              <Select 
                name="topic" 
                required 
                disabled={!selectedSubject}
                onValueChange={(value) => {
                  setSelectedTopic(value);
                  setSelectedQuestionType('');
                }}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder={selectedSubject ? "Konu seçin" : "Önce ders seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic.id} value={topic.id}>
                      {topic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="questionType" className="md:text-right">
                Soru Tipi
              </Label>
              <Select 
                name="questionType" 
                disabled={!selectedTopic}
                onValueChange={(value) => setSelectedQuestionType(value)}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder={selectedTopic ? "Soru tipi seçin" : "Önce konu seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map((qt) => (
                    <SelectItem key={qt.id} value={qt.id}>
                      {qt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="taskType" className="md:text-right">
                Görev Türü
              </Label>
              <Select name="taskType" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Görev türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEST">Test / Soru Çözümü</SelectItem>
                  <SelectItem value="REVIEW">Konu Tekrarı</SelectItem>
                  <SelectItem value="READING">Okuma</SelectItem>
                  <SelectItem value="VIDEO">Video İzleme</SelectItem>
                  <SelectItem value="PRACTICE">Pratik</SelectItem>
                  <SelectItem value="PROJECT">Proje</SelectItem>
                  <SelectItem value="EXAM">Deneme</SelectItem>
                  <SelectItem value="OTHER">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="studyMethod" className="md:text-right">
                Çalışma Yöntemi
              </Label>
              <Select name="studyMethod" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Çalışma yöntemi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRACTICE">Pratik / Soru Çözümü</SelectItem>
                  <SelectItem value="VIDEO">Video İzleme</SelectItem>
                  <SelectItem value="READING">Okuma</SelectItem>
                  <SelectItem value="TEST">Test Çözme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="estimatedPomodoros" className="md:text-right">
                Tahmini Pomodoro Sayısı
              </Label>
              <Input
                id="estimatedPomodoros"
                name="estimatedPomodoros"
                type="number"
                min="0"
                placeholder="Örn: 2"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="priority" className="md:text-right">
                Öncelik
              </Label>
              <Select name="priority" required>
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Öncelik seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Yüksek</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="taskDate" className="md:text-right">
                Tarih
              </Label>
              <Input
                id="taskDate"
                name="taskDate"
                type="date"
                className="col-span-1 md:col-span-3"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Görev Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
