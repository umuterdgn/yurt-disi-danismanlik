"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  BookOpen, 
  GraduationCap, 
  FileText, 
  Send, 
  Trophy, 
  Plane,
  Circle,
  CheckCircle,
  Lock
} from "lucide-react";

interface JourneyStep {
  id: string;
  title: string;
  icon: any;
  description: string;
  status: 'completed' | 'active' | 'pending' | 'locked';
  date?: string;
}

interface MyJourneyProps {
  studentProfile: {
    targetUniversity?: string;
    targetExam?: string;
    examDate?: Date | string;
    currentScore?: number;
    targetScore?: number;
    applications?: any[];
  };
}

export function MyJourney({ studentProfile }: MyJourneyProps) {
  const calculateJourneySteps = (): JourneyStep[] => {
    const steps: JourneyStep[] = [
      {
        id: 'goal',
        title: 'Hedef Belirlendi',
        icon: Target,
        description: 'Hedef üniversite ve sınav belirlendi',
        status: 'completed',
        date: studentProfile.targetUniversity ? 'Belirlendi' : undefined
      },
      {
        id: 'exam',
        title: 'Sınav Hazırlığı',
        icon: BookOpen,
        description: `${studentProfile.targetExam || 'Sınav'} hazırlığı`,
        status: studentProfile.currentScore && studentProfile.targetScore 
          ? (studentProfile.currentScore >= studentProfile.targetScore * 0.8 ? 'completed' : 'active')
          : 'pending',
        date: studentProfile.examDate ? new Date(studentProfile.examDate).toLocaleDateString('tr-TR') : undefined
      },
      {
        id: 'universities',
        title: 'Üniversiteler Seçildi',
        icon: GraduationCap,
        description: 'Hedef üniversiteler araştırıldı',
        status: studentProfile.applications && studentProfile.applications.length > 0 ? 'completed' : 'pending',
        date: studentProfile.applications && studentProfile.applications.length > 0 
          ? `${studentProfile.applications.length} üniversite` 
          : undefined
      },
      {
        id: 'documents',
        title: 'Evraklar Tamamlandı',
        icon: FileText,
        description: 'Gerekli belgeler hazırlandı',
        status: 'pending',
        date: undefined
      },
      {
        id: 'application',
        title: 'Başvuru Yapıldı',
        icon: Send,
        description: 'Üniversite başvuruları gönderildi',
        status: 'pending',
        date: undefined
      },
      {
        id: 'offer',
        title: 'Offer Alındı',
        icon: Trophy,
        description: 'Kabul mektubu alındı',
        status: 'locked',
        date: undefined
      },
      {
        id: 'flight',
        title: 'Uçuş',
        icon: Plane,
        description: 'Yurt dışına yolculuk',
        status: 'locked',
        date: undefined
      }
    ];

    // Update based on application status
    if (studentProfile.applications && studentProfile.applications.length > 0) {
      const applications = studentProfile.applications;
      const hasSubmittedApplications = applications.some((app: any) => 
        ['SUBMITTED', 'OFFER', 'DEPOSIT', 'VISA', 'ENROLLED'].includes(app.status)
      );
      
      const hasOffer = applications.some((app: any) => 
        ['OFFER', 'DEPOSIT', 'VISA', 'ENROLLED'].includes(app.status)
      );

      const hasCompletedDocuments = applications.some((app: any) => {
        if (!app.documents) return false;
        const approvedDocs = app.documents.filter((d: any) => d.status === 'APPROVED').length;
        return approvedDocs >= 4; // Assuming at least 4 documents needed
      });

      // Update document step
      if (hasCompletedDocuments) {
        steps[3].status = 'completed';
        steps[3].date = 'Tamamlandı';
      } else if (applications.some((app: any) => app.documents && app.documents.length > 0)) {
        steps[3].status = 'active';
        steps[3].date = 'Devam ediyor';
      }

      // Update application step
      if (hasSubmittedApplications) {
        steps[4].status = 'completed';
        steps[4].date = 'Gönderildi';
      } else if (hasCompletedDocuments) {
        steps[4].status = 'active';
      }

      // Update offer step
      if (hasOffer) {
        steps[5].status = 'completed';
        steps[5].date = 'Alındı';
        steps[6].status = 'active'; // Unlock flight step
      }
    }

    // Find the first pending step and make it active
    const firstPendingIndex = steps.findIndex(step => step.status === 'pending');
    if (firstPendingIndex !== -1) {
      steps[firstPendingIndex].status = 'active';
    }

    // Lock all steps after the first active step
    let foundActive = false;
    steps.forEach((step, index) => {
      if (step.status === 'active') {
        foundActive = true;
      } else if (!foundActive && step.status === 'pending') {
        step.status = 'locked';
      }
    });

    return steps;
  };

  const journeySteps = calculateJourneySteps();

  const getStepIcon = (step: JourneyStep) => {
    const Icon = step.icon;
    const iconSize = "w-6 h-6";

    if (step.status === 'completed') {
      return (
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className={`${iconSize} text-green-600`} />
        </div>
      );
    } else if (step.status === 'active') {
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
          <Icon className={`${iconSize} text-blue-600`} />
        </div>
      );
    } else if (step.status === 'locked') {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Lock className={`${iconSize} text-gray-400`} />
        </div>
      );
    } else {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          <Circle className={`${iconSize} text-gray-400`} />
        </div>
      );
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-300 bg-green-50';
      case 'active':
        return 'border-blue-300 bg-blue-50';
      case 'locked':
        return 'border-gray-200 bg-gray-50 opacity-60';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Tamamlandı</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-700">Devam Ediyor</Badge>;
      case 'locked':
        return <Badge variant="outline" className="text-gray-500">Bekliyor</Badge>;
      default:
        return <Badge variant="outline">Bekliyor</Badge>;
    }
  };

  const calculateProgress = () => {
    const completedSteps = journeySteps.filter(step => step.status === 'completed').length;
    return Math.round((completedSteps / journeySteps.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            My Journey
          </div>
          <Badge variant="outline">
            %{calculateProgress()} Tamamlandı
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Steps */}
          <div className="space-y-6">
            {journeySteps.map((step, index) => (
              <div key={step.id} className="relative flex items-start gap-4">
                {/* Icon */}
                <div className="relative z-10">
                  {getStepIcon(step)}
                </div>

                {/* Content */}
                <div className={`flex-1 p-4 rounded-lg border ${getStepColor(step.status)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    {getStepBadge(step.status)}
                  </div>
                  
                  {step.date && (
                    <div className="mt-2 text-xs text-gray-500">
                      📅 {step.date}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Tamamlanan</p>
              <p className="text-xl font-bold text-green-600">
                {journeySteps.filter(step => step.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Devam Eden</p>
              <p className="text-xl font-bold text-blue-600">
                {journeySteps.filter(step => step.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Kalan</p>
              <p className="text-xl font-bold text-gray-600">
                {journeySteps.filter(step => step.status === 'locked' || step.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}