"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, Plus } from "lucide-react";
import { toast } from "sonner";
import { createAdvancedExam } from "@/actions/advanced-exam";

interface SubjectScores {
  correct: number;
  wrong: number;
  empty: number;
}

interface AddAdvancedExamDialogProps {
  students: { id: string; name: string }[];
  studentId?: string; // Optional for direct student usage
}

export function AddAdvancedExamDialog({ students, studentId }: AddAdvancedExamDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [advisorComments, setAdvisorComments] = useState("");
  
  // Subject scores state
  const [turkish, setTurkish] = useState<SubjectScores>({ correct: 0, wrong: 0, empty: 0 });
  const [math, setMath] = useState<SubjectScores>({ correct: 0, wrong: 0, empty: 0 });
  const [science, setScience] = useState<SubjectScores>({ correct: 0, wrong: 0, empty: 0 });
  const [social, setSocial] = useState<SubjectScores>({ correct: 0, wrong: 0, empty: 0 });
  const [ocrLoading, setOcrLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setOcrLoading(true);

    try {
      // Convert image to base64
      const base64 = await fileToBase64(file);

      // Send to Groq Vision API
      const response = await fetch('/api/ai/ocr-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });

      if (!response.ok) throw new Error('OCR processing failed');

      const data = await response.json();

      // Update form with extracted data
      if (data.scores) {
        if (data.scores.turkish) setTurkish(data.scores.turkish);
        if (data.scores.math) setMath(data.scores.math);
        if (data.scores.science) setScience(data.scores.science);
        if (data.scores.social) setSocial(data.scores.social);
        toast.success('Görsel başarıyla işlendi!');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Görsel işlenirken hata oluştu');
    } finally {
      setOcrLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubjectChange = (subject: string, field: keyof SubjectScores, value: string) => {
    const numValue = parseInt(value) || 0;
    const setter = {
      turkish: setTurkish,
      math: setMath,
      science: setScience,
      social: setSocial
    }[subject];

    setter?.(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const calculateNet = (scores: SubjectScores) => {
    return scores.correct - (scores.wrong / 4);
  };

  const calculateTotalNet = () => {
    return calculateNet(turkish) + calculateNet(math) + calculateNet(science) + calculateNet(social);
  };

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    // Add subject scores to form data
    formData.append('turkish_correct', turkish.correct.toString());
    formData.append('turkish_wrong', turkish.wrong.toString());
    formData.append('turkish_empty', turkish.empty.toString());
    
    formData.append('math_correct', math.correct.toString());
    formData.append('math_wrong', math.wrong.toString());
    formData.append('math_empty', math.empty.toString());
    
    formData.append('science_correct', science.correct.toString());
    formData.append('science_wrong', science.wrong.toString());
    formData.append('science_empty', science.empty.toString());
    
    formData.append('social_correct', social.correct.toString());
    formData.append('social_wrong', social.wrong.toString());
    formData.append('social_empty', social.empty.toString());
    
    formData.append('totalNet', calculateTotalNet().toString());
    formData.append('advisorComments', advisorComments);

    const result = await createAdvancedExam(formData);
    
    if (result.success) {
      toast.success("Gelişmiş deneme başarıyla eklendi!");
      setOpen(false);
      // Reset form
      setTurkish({ correct: 0, wrong: 0, empty: 0 });
      setMath({ correct: 0, wrong: 0, empty: 0 });
      setScience({ correct: 0, wrong: 0, empty: 0 });
      setSocial({ correct: 0, wrong: 0, empty: 0 });
      window.location.reload();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  const SubjectRow = ({ 
    title, 
    scores, 
    onChange, 
    color 
  }: { 
    title: string; 
    scores: SubjectScores; 
    onChange: (field: keyof SubjectScores, value: string) => void;
    color: string;
  }) => (
    <div className={`border rounded-lg p-4 ${color}`}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs text-green-700">Doğru</Label>
          <Input
            type="number"
            min="0"
            value={scores.correct}
            onChange={(e) => onChange('correct', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-red-700">Yanlış</Label>
          <Input
            type="number"
            min="0"
            value={scores.wrong}
            onChange={(e) => onChange('wrong', e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label className="text-xs text-gray-700">Boş</Label>
          <Input
            type="number"
            min="0"
            value={scores.empty}
            onChange={(e) => onChange('empty', e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
      <div className="mt-2 text-sm font-medium">
        Net: {calculateNet(scores).toFixed(2)}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Gelişmiş Deneme Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gelişmiş Deneme Ekle</DialogTitle>
          <DialogDescription>
            Ders bazlı detaylı deneme sonuçları girin.
          </DialogDescription>
        </DialogHeader>
        
        {/* OCR Upload Section */}
        <div className="flex justify-center mb-4">
          <div className="w-full">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={ocrLoading}
              className="hidden"
              id="ocr-upload-advanced"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('ocr-upload-advanced')?.click()}
              disabled={ocrLoading}
              className="w-full border-dashed"
            >
              <Camera className="w-4 h-4 mr-2" />
              {ocrLoading ? 'İşleniyor...' : '📷 Fotoğraftan Oku / Yükle'}
            </Button>
            {imageFile && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Seçilen: {imageFile.name}
              </p>
            )}
          </div>
        </div>

        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Student Selection */}
            {!studentId && (
              <div className="grid grid-cols-1 items-center gap-2">
                <Label htmlFor="studentProfileId">Öğrenci</Label>
                <Select name="studentProfileId" required>
                  <SelectTrigger>
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
            )}
            
            {studentId && (
              <input type="hidden" name="studentProfileId" value={studentId} />
            )}

            {/* Exam Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="examName">Deneme Adı</Label>
                <Input
                  id="examName"
                  name="examName"
                  placeholder="Örn: TYT Deneme 1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="examDate">Tarih</Label>
                <Input
                  id="examDate"
                  name="examDate"
                  type="date"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="examType">Sınav Türü</Label>
              <Select name="examType" required>
                <SelectTrigger>
                  <SelectValue placeholder="Sınav türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TYT">TYT</SelectItem>
                  <SelectItem value="AYT">AYT</SelectItem>
                  <SelectItem value="YKS">YKS</SelectItem>
                  <SelectItem value="DGS">DGS</SelectItem>
                  <SelectItem value="MSÜ">MSÜ</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Subject Scores Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Ders Bazlı Sonuçlar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SubjectRow
                  title="Türkçe"
                  scores={turkish}
                  onChange={(field, value) => handleSubjectChange('turkish', field, value)}
                  color="bg-blue-50 border-blue-200"
                />
                <SubjectRow
                  title="Matematik"
                  scores={math}
                  onChange={(field, value) => handleSubjectChange('math', field, value)}
                  color="bg-green-50 border-green-200"
                />
                <SubjectRow
                  title="Fen Bilimleri"
                  scores={science}
                  onChange={(field, value) => handleSubjectChange('science', field, value)}
                  color="bg-purple-50 border-purple-200"
                />
                <SubjectRow
                  title="Sosyal Bilimler"
                  scores={social}
                  onChange={(field, value) => handleSubjectChange('social', field, value)}
                  color="bg-orange-50 border-orange-200"
                />
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Toplam Net:</span>
                <span className="text-2xl font-bold text-blue-600">
                  {calculateTotalNet().toFixed(2)}
                </span>
              </div>
            </div>

            {/* Advisor Comments */}
            <div>
              <Label htmlFor="advisorComments">Danışman Yorumu ve Gözlemleri</Label>
              <Textarea
                id="advisorComments"
                value={advisorComments}
                onChange={(e) => setAdvisorComments(e.target.value)}
                placeholder="Öğrencinin performansı, dikkat edilmesi gereken konular, öneriler..."
                className="min-h-[100px]"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Bu yorum AI tarafından Konu Haritası (Mastery Map) güncellemesinde kullanılacaktır.
              </p>
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Gelişmiş Deneme Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}