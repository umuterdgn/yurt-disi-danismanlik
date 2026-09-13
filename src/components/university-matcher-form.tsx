"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, MapPin, DollarSign, GraduationCap, Star, CheckCircle, Target } from "lucide-react";
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
}

export function UniversityMatcherForm({ studentProfile, countries, departments, students, studentId, isAdvisor = false }: UniversityMatcherFormProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<UniversityMatch[]>([]);
  const [creatingApplication, setCreatingApplication] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || '');
  const [formData, setFormData] = useState({
    budget: studentProfile?.applications?.[0]?.estimatedBudget?.toString() || '',
    gpa: '',
    ieltsScore: studentProfile?.applications?.[0]?.languageScore?.toString() || '',
    targetCountry: '',
    department: studentProfile?.applications?.[0]?.program || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await matchUniversitiesWithAI(formData);
      
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isAdvisor && students && students.length > 0 && (
          <div>
            <Label htmlFor="student">Öğrenci Seç</Label>
            <Select
              value={selectedStudentId}
              onValueChange={setSelectedStudentId}
              required
            >
              <SelectTrigger id="student">
                <SelectValue placeholder="Öğrenci seçin" />
              </SelectTrigger>
              <SelectContent>
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
          <Label htmlFor="gpa">Not Ortalaması (GPA)</Label>
          <Input
            id="gpa"
            type="number"
            step="0.01"
            min="0"
            max="4"
            placeholder="Örn: 3.5"
            value={formData.gpa}
            onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="ieltsScore">IELTS Puanı</Label>
          <Input
            id="ieltsScore"
            type="number"
            step="0.5"
            min="0"
            max="9"
            placeholder="Örn: 6.5"
            value={formData.ieltsScore}
            onChange={(e) => setFormData({ ...formData, ieltsScore: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="targetCountry">Hedef Ülke</Label>
          <Select
            value={formData.targetCountry}
            onValueChange={(value) => setFormData({ ...formData, targetCountry: value })}
            required
          >
            <SelectTrigger id="targetCountry">
              <SelectValue placeholder="Ülke seçin" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.name}>
                  {country.flag} {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="department">Bölüm/Program</Label>
          <Select
            value={formData.department}
            onValueChange={(value) => setFormData({ ...formData, department: value })}
            required
          >
            <SelectTrigger id="department">
              <SelectValue placeholder="Bölüm seçin" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                      Kabul Şartları
                    </h4>
                    <ul className="space-y-1">
                      {match.admissionRequirements.map((req, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {isAdvisor ? (
                    <Button
                      onClick={() => handleSelectAsTarget(match)}
                      disabled={creatingApplication === match.name || !selectedStudentId}
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
                          Öğrenci Hedefi Olarak Ata
                        </>
                      )}
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}