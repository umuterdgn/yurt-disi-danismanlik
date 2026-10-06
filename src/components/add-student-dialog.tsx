"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { addStudent } from "@/actions/add-student";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const SYMBOLS = [
  { emoji: "🎓", name: "Mezun" },
  { emoji: "🚀", name: "Roket" },
  { emoji: "🦁", name: "Aslan" },
  { emoji: "🦉", name: "Baykuş" },
  { emoji: "⚡", name: "Yıldırım" },
  { emoji: "🔥", name: "Alev" },
  { emoji: "🌟", name: "Yıldız" },
  { emoji: "💎", name: "Elmas" },
  { emoji: "🎯", name: "Hedef" },
  { emoji: "🏆", name: "Kupa" },
  { emoji: "🎨", name: "Sanat" },
  { emoji: "🎸", name: "Müzik" },
];

export function AddStudentDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [targetScore, setTargetScore] = useState<number>(0);
  const [grade, setGrade] = useState<string>("");
  const [domain, setDomain] = useState<string>("");
  const router = useRouter();

  // Fetch universities when dialog opens
  useEffect(() => {
    if (open) {
      fetchUniversities();
    }
  }, [open]);

  async function fetchUniversities() {
    try {
      const response = await fetch('/api/admin/universities');
      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
    }
  }

  // Handle university selection - multi-select with auto-fill target score
  function handleUniversityToggle(universityName: string) {
    setSelectedUniversities(prev => {
      const newSelection = prev.includes(universityName)
        ? prev.filter(u => u !== universityName)
        : [...prev, universityName];
      
      // Auto-fill target score based on highest base score
      const maxScore = universities
        .filter(u => newSelection.includes(u.name))
        .reduce((max, u) => Math.max(max, u.baseScore || 0), 0);
      setTargetScore(maxScore);
      
      return newSelection;
    });
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");

    // Add selected universities and domain to form data
    formData.append('targetUniversities', JSON.stringify(selectedUniversities));
    formData.append('domain', domain);

    const result = await addStudent(formData);

    if (result.success && result.student) {
      // Show success toast with login credentials
      const password = result.generatedPassword || 'Formda girilen şifre';
      toast.success(
        "Öğrenci başarıyla eklendi!",
        {
          description: `E-posta: ${result.student.email}\nŞifre: ${password}\nLütfen bu bilgileri öğrenciye iletin.`,
          duration: 10000, // Show for 10 seconds
        }
      );

      setOpen(false);
      setLoading(false);
      // Refresh the page to show the new student
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
          Yeni Öğrenci Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Yeni Öğrenci Ekle</DialogTitle>
          <DialogDescription>
            Yeni bir öğrenci eklemek için bilgileri doldurun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="name" className="md:text-right">
                Ad Soyad
              </Label>
              <Input
                id="name"
                name="name"
                placeholder="Öğrenci adı soyadı"
                className="col-span-1 md:col-span-3 w-full"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="email" className="md:text-right">
                E-posta
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="ogrenci@example.com"
                className="col-span-1 md:col-span-3 w-full"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="password" className="md:text-right">
                Giriş Şifresi <span className="text-gray-400">(Opsiyonel)</span>
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Boş bırakılırsa otomatik oluşturulur"
                className="col-span-1 md:col-span-3 w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="grade" className="md:text-right">
                Sınıf
              </Label>
              <Select name="grade" onValueChange={setGrade} required>
                <SelectTrigger className="col-span-1 md:col-span-3 w-full">
                  <SelectValue placeholder="Sınıf seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9. Sınıf</SelectItem>
                  <SelectItem value="10">10. Sınıf</SelectItem>
                  <SelectItem value="11">11. Sınıf</SelectItem>
                  <SelectItem value="12">12. Sınıf</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="domain" className="md:text-right">
                YKS Alanı
              </Label>
              <Select name="domain" onValueChange={setDomain} required>
                <SelectTrigger className="col-span-1 md:col-span-3 w-full">
                  <SelectValue placeholder="Alan seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAYISAL">Sayısal</SelectItem>
                  <SelectItem value="SOZEL">Sözel</SelectItem>
                  <SelectItem value="ESIT_AGIRLIK">Eşit Ağırlık</SelectItem>
                  <SelectItem value="DIL">Dil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Show University field only for 12th grade students */}
            {grade === '12' && (
              <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4">
                <Label htmlFor="targetUniversities" className="md:text-right pt-2">
                  Hedef Üniversiteler
                </Label>
                <div className="col-span-1 md:col-span-3 space-y-2 w-full">
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    {universities.length === 0 ? (
                      <p className="text-sm text-gray-500">Üniversite yükleniyor...</p>
                    ) : (
                      universities.map((university) => (
                        <div key={university.id} className="flex items-center space-x-2 py-1">
                          <Checkbox
                            id={`university-${university.id}`}
                            checked={selectedUniversities.includes(university.name)}
                            onCheckedChange={() => handleUniversityToggle(university.name)}
                          />
                          <Label
                            htmlFor={`university-${university.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {university.name}
                            {university.baseScore && (
                              <span className="text-xs text-gray-500 ml-2">
                                (Taban: {university.baseScore})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedUniversities.length > 0 && (
                    <p className="text-xs text-gray-600">
                      Seçilen: {selectedUniversities.join(', ')}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="targetScore" className="md:text-right">
                Hedef Puan (Otomatik)
              </Label>
              <Input
                id="targetScore"
                name="targetScore"
                type="number"
                step="0.01"
                value={targetScore}
                onChange={(e) => setTargetScore(parseFloat(e.target.value) || 0)}
                placeholder="Üniversite taban puanı"
                className="col-span-1 md:col-span-3 w-full"
                readOnly
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-2 md:gap-4">
              <Label htmlFor="studentSymbol" className="md:text-right">
                Sembol Seçimi
              </Label>
              <Select name="studentSymbol" defaultValue="🎓">
                <SelectTrigger className="col-span-1 md:col-span-3 w-full">
                  <SelectValue placeholder="Sembol seçin" />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((symbol) => (
                    <SelectItem key={symbol.emoji} value={symbol.emoji}>
                      <span className="flex items-center gap-2">
                        <span className="text-xl">{symbol.emoji}</span>
                        <span>{symbol.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 items-start gap-2 md:gap-4">
              <Label htmlFor="serviceType" className="md:text-right pt-2">
                Hizmet Türü
              </Label>
              <RadioGroup name="serviceType" defaultValue="BOTH" className="col-span-1 md:col-span-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COACHING" id="coaching" />
                  <Label htmlFor="coaching" className="font-normal cursor-pointer">
                    Sadece Eğitim Koçluğu
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="STUDY_ABROAD" id="study_abroad" />
                  <Label htmlFor="study_abroad" className="font-normal cursor-pointer">
                    Sadece Yurt Dışı Danışmanlığı
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BOTH" id="both" />
                  <Label htmlFor="both" className="font-normal cursor-pointer">
                    İkisi Birlikte (Tam Paket)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Ekleniyor..." : "Öğrenci Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
