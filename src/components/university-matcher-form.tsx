"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Sparkles, MapPin, DollarSign, GraduationCap, Star, CheckCircle, Target, User } from "lucide-react";
import { toast } from "sonner";
import { matchUniversitiesWithAI } from "@/actions/ai-university-matcher";
import { createApplicationFromMatch } from "@/actions/create-application-from-match";

interface UniversityMatcherFormProps {
  studentProfile?: any; // Optional for advisor context
  countries: any[];
  departments: string[];
  students?: any[]; // For advisor context
  studentId?: string; // Optional for advisor context
  isAdvisor?: boolean; // Flag for advisor mode
}

interface UniversityMatch {
  name: string;
  country: string;
  matchPercentage: number;
  reasons: string[];
  estimatedCost: string;
  requirements: string[];
  admissionRequirements: string[];
  ranking?: number;
  documentCount?: number; // Number of required documents
  comparison?: string; // Comparison with other options
  alternatives?: string[]; // Alternative universities
}

export function UniversityMatcherForm({ studentProfile, countries, departments, students, studentId, isAdvisor = false }: UniversityMatcherFormProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [creatingApplication, setCreatingApplication] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<UniversityMatch | null>(null);
  const [assignmentStudentId, setAssignmentStudentId] = useState('');
  const [formData, setFormData] = useState({
    budget: studentProfile?.applications?.[0]?.estimatedBudget?.toString() || '',
    gpa: '',
    ieltsScore: studentProfile?.applications?.[0]?.languageScore?.toString() || '',
    targetCountry: '',
    department: studentProfile?.applications?.[0]?.program || '',
    socialSkills: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await matchUniversitiesWithAI({
        ...formData,
        socialSkills: formData.socialSkills // Include social skills in the request
      });
      
      if (result.success && result.matches) {
        setMatches(result.matches);
        toast.success("Üniversite eşleştirmesi tamamlandı!");
      } else {
        toast.error(result.error || "Eşleştirme sırasında bir hata oluştu");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const getMatchStars = (percentage: number) => {
    const stars = Math.round(percentage / 20);
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-100 border-green-300 text-green-900';
    if (percentage >= 75) return 'bg-blue-100 border-blue-300 text-blue-900';
    if (percentage >= 60) return 'bg-yellow-100 border-yellow-300 text-yellow-900';
    return 'bg-gray-100 border-gray-300 text-gray-900';
  };

  const handleSelectAsTarget = async (match: UniversityMatch) => {
    const targetStudentId = isAdvisor ? selectedStudentId : studentId;
    
    if (!targetStudentId) {
      toast.error('Öğrenci ID bulunamadı');
      return;
    }

    setCreatingApplication(match.name);
    
    try {
      const result = await createApplicationFromMatch({
        studentProfileId: targetStudentId,
        universityName: match.name,
        country: match.country,
        estimatedCost: match.estimatedCost,
        admissionRequirements: match.admissionRequirements,
        program: formData.department
      });

      if (result.success) {
        toast.success(`${match.name} hedef olarak seçildi! Başvuru ve evraklar otomatik oluşturuldu.`);
      } else {
        toast.error(result.error || 'Başvuru oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setCreatingApplication(null);
    }
  };

  const handleAssignToStudent = (match: UniversityMatch) => {
    setSelectedMatch(match);
    setAssignmentModalOpen(true);
  };

  const handleStudentAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMatch || !assignmentStudentId) {
      toast.error('Lütfen bir öğrenci seçin');
      return;
    }

    setCreatingApplication(selectedMatch.name);
    
    try {
      const result = await createApplicationFromMatch({
        studentProfileId: assignmentStudentId,
        universityName: selectedMatch.name,
        country: selectedMatch.country,
        estimatedCost: selectedMatch.estimatedCost,
        admissionRequirements: selectedMatch.admissionRequirements,
        program: formData.department
      });

      if (result.success) {
        toast.success(`${selectedMatch.name} öğrenciye atandı! Başvuru ve evraklar otomatik oluşturuldu.`);
        setAssignmentModalOpen(false);
        setAssignmentStudentId('');
        setSelectedMatch(null);
      } else {
        toast.error(result.error || 'Başvuru oluşturulurken bir hata oluştu');
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setCreatingApplication(null);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
        {isAdvisor && students && students.length > 0 && (
          <div>
            <Label htmlFor="student">Öğrenci Seç (Opsiyonel)</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
            >
              <SelectTrigger id="student">
                <SelectValue placeholder="Serbest araştırma veya öğrenci seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Serbest Araştırma</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.user.name} - {student.grade}. Sınıf
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="budget">Yıllık Bütçe ($)</Label>
          <Input
            id="budget"
            type="number"
            placeholder="Örn: 25000"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="gpa">Not Ortalaması (GPA) <span className="text-gray-400">(Opsiyonel)</span></Label>
          <Input
            id="gpa"
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder="Örn: 3.5"
            value={formData.gpa}
            onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="ieltsScore">IELTS Puanı <span className="text-gray-400">(Opsiyonel)</span></Label>
          <Input
            id="ieltsScore"
            type="number"
            step="0.5"
            min="0"
            max="9"
            placeholder="Örn: 6.5"
            value={formData.ieltsScore}
            onChange={(e) => setFormData({ ...formData, ieltsScore: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="targetCountry">Hedef Ülke (Serbest Metin)</Label>
          <Input
            id="targetCountry"
            placeholder="Örn: Amerika Birleşik Devletleri, İngiltere, Almanya"
            value={formData.targetCountry}
            onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Herhangi bir dünya ülkesini yazabilirsiniz</p>
        </div>

        <div>
          <Label htmlFor="department">Bölüm/Program (Serbest Metin)</Label>
          <Input
            id="department"
            placeholder="Örn: Bilgisayar Mühendisliği, İşletme, Tıp"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            required
          />
          <p className="text-xs text-gray-500 mt-1">Herhangi bir bölüm veya program yazabilirsiniz</p>
        </div>

        <div>
          <Label htmlFor="socialSkills">Sosyal Yetenekler & Ekstra Başarılar</Label>
          <textarea
            id="socialSkills"
            placeholder="Örn: Milli sporcu, sanat ödülü, B2 İngilizce, liderlik deneyimi, gönüllü çalışma..."
            value={formData.socialSkills}
            onChange={(e) => setFormData({ ...formData, socialSkills: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[100px] text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">Bu bilgiler AI tarafından kabul ihtimali hesaplamasında kullanılacaktır</p>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Üniversite Eşleştir
            </>
          )}
        </Button>
      </form>

      {/* Results */}
      {matches.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            AI Önerileri
          </h3>
          
          {matches.map((match, index) => (
            <Card key={index} className={`border-2 ${getMatchColor(match.matchPercentage)}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{match.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{match.country}</span>
                      {match.ranking && (
                        <Badge variant="outline" className="ml-2">
                          #{match.ranking} Sıralama
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {getMatchStars(match.matchPercentage)}
                    </div>
                    <div className="text-2xl font-bold">%{match.matchPercentage}</div>
                    <div className="text-xs">Eşleşme</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm font-medium">Tahmini Maliyet:</span>
                    <span className="text-sm">{match.estimatedCost}</span>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Neden Önerildi?
                    </h4>
                    <ul className="space-y-1">
                      {match.reasons.map((reason, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-1">✓</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Gereksinimler
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {match.requirements.map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Kesin Kabul Şartları
                    </h4>
                    <ul className="space-y-1">
                      {match.admissionRequirements.map((req, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span className="font-medium">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {match.comparison && (
                    <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-orange-900">
                        <Target className="w-4 h-4" />
                        Kıyaslama Analizi
                      </h4>
                      <p className="text-xs text-orange-700">{match.comparison}</p>
                    </div>
                  )}

                  {match.alternatives && match.alternatives.length > 0 && (
                    <div className="bg-teal-50 rounded-lg p-3 border border-teal-200">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-teal-900">
                        <GraduationCap className="w-4 h-4" />
                        Alternatif/Muadil Üniversiteler
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {match.alternatives.map((alt, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-white border-teal-300">
                            {alt}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-purple-900">
                      <Target className="w-4 h-4" />
                      Otomatik Evrak Atama
                    </h4>
                    <p className="text-xs text-purple-700">
                      Bu üniversite seçildiğinde sistem otomatik olarak {match.admissionRequirements.length} belge oluşturacak ve öğrencinin Evraklarım sayfasına ekleyecek.
                    </p>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {match.admissionRequirements.slice(0, 3).map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-white">
                          {req.split(' ').slice(0, 2).join(' ')}...
                        </Badge>
                      ))}
                      {match.admissionRequirements.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-white">
                          +{match.admissionRequirements.length - 3} daha
                        </Badge>
                      )}
                    </div>
                  </div>

                  {isAdvisor ? (
                    <div className="space-y-2">
                      {selectedStudentId ? (
                        <Button
                          onClick={() => handleSelectAsTarget(match)}
                          disabled={creatingApplication === match.name}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {creatingApplication === match.name ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Oluşturuluyor...
                            </>
                          ) : (
                            <>
                              <Target className="w-4 h-4 mr-2" />
                              Seçilen Öğrenciye Ata
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleAssignToStudent(match)}
                          disabled={creatingApplication === match.name}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {creatingApplication === match.name ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Oluşturuluyor...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Bu Hedefi Bir Öğrenciye Ata
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>

      {/* Student Assignment Modal */}
      {assignmentModalOpen && selectedMatch && (
        <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Öğrenciye Ata</DialogTitle>
              <p className="text-sm text-gray-600">
                {selectedMatch.name} ({selectedMatch.country}) hedefini bir öğrenciye atayın
              </p>
            </DialogHeader>
            <form onSubmit={handleStudentAssignment}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="assignmentStudent">Öğrenci Seç</Label>
                  <Select
                    value={assignmentStudentId}
                    onValueChange={setAssignmentStudentId}
                  >
                    <SelectTrigger id="assignmentStudent">
                      <SelectValue placeholder="Öğrenci seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {students && students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.user.name} - {student.grade}. Sınıf
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setAssignmentModalOpen(false);
                    setAssignmentStudentId('');
                    setSelectedMatch(null);
                  }}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={creatingApplication === selectedMatch.name || !assignmentStudentId}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creatingApplication === selectedMatch.name ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    'Ata ve Başvuru Oluştur'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}