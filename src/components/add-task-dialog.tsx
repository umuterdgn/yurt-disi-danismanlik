"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTask } from "@/actions/add-task";
import { CURRICULUM, getSubjectsForExamType, getTopicsForSubject, getAllExamTypes } from "@/lib/constants/curriculum";
import { Plus, Calendar } from "lucide-react";
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
  const [selectedExamType, setSelectedExamType] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedQuestionType, setSelectedQuestionType] = useState("");
  const [taskDate, setTaskDate] = useState("");

  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);

  // Set default date to today when dialog opens
  useEffect(() => {
    if (open) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      setTaskDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [open]);

  // Load curriculum data when dialog opens
  useEffect(() => {
    if (open) {
      loadCurriculumData();
    }
  }, [open]);

  const loadCurriculumData = () => {
    try {
      const allExamTypes = getAllExamTypes();
      setExamTypes(allExamTypes);
    } catch (error) {
      console.error('Error loading curriculum:', error);
    }
  };

  // Load subjects when exam type changes
  useEffect(() => {
    if (selectedExamType) {
      const subjectList = getSubjectsForExamType(selectedExamType);
      setSubjects(subjectList);
      setSelectedSubject("");
      setSelectedTopic("");
    } else {
      setSubjects([]);
      setTopics([]);
    }
  }, [selectedExamType]);

  // Load topics when subject changes
  useEffect(() => {
    if (selectedExamType && selectedSubject) {
      const topicList = getTopicsForSubject(selectedExamType, selectedSubject);
      setTopics(topicList);
      setSelectedTopic("");
    } else {
      setTopics([]);
    }
  }, [selectedExamType, selectedSubject]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    // Add curriculum data to form data
    if (selectedExamType) {
      formData.append('examType', selectedExamType);
    }
    if (selectedSubject) {
      formData.append('subject', selectedSubject);
    }
    if (selectedTopic) {
      formData.append('topic', selectedTopic);
    }

    // Ensure taskDate is set (use today if not set)
    if (!taskDate) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      formData.append('taskDate', `${yyyy}-${mm}-${dd}`);
    } else {
      formData.append('taskDate', taskDate);
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
              <Label htmlFor="description" className="md:text-right">
                Açıklama
              </Label>
              <Input
                id="description"
                name="description"
                placeholder="Görev detayları (opsiyonel)"
                className="col-span-1 md:col-span-3"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="examType" className="md:text-right">
                Sınav Türü / Sınıf
              </Label>
              <Select 
                name="examType" 
                required 
                onValueChange={(value) => {
                  setSelectedExamType(value);
                  setSelectedSubject("");
                  setSelectedTopic("");
                }}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder="Sınav türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {examTypes.map((examType) => (
                    <SelectItem key={examType} value={examType}>
                      {examType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="subject" className="md:text-right">
                Ders
              </Label>
              <Select 
                name="subject" 
                required 
                disabled={!selectedExamType}
                onValueChange={(value) => {
                  setSelectedSubject(value);
                  setSelectedTopic("");
                }}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder={selectedExamType ? "Ders seçin" : "Önce sınav türü seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
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
                onValueChange={(value) => setSelectedTopic(value)}
              >
                <SelectTrigger className="col-span-1 md:col-span-3">
                  <SelectValue placeholder={selectedSubject ? "Konu seçin" : "Önce ders seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {topic}
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
              <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                <Input
                  id="taskDate"
                  name="taskDate"
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  className="flex-1"
                  required
                />
                <Calendar className="w-4 h-4 text-gray-400" />
              </div>
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
