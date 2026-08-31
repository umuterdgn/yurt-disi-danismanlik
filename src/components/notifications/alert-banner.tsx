import { prisma } from "@/lib/prisma";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock, FileText, Calendar } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function AlertBanner() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.email) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, role: true }
  });

  if (!dbUser) {
    return null;
  }

  let alerts: Array<{ type: 'deadline' | 'document' | 'visa'; message: string; urgency: 'high' | 'medium' | 'low' }> = [];

  // SUPER_ADMIN sees all alerts
  if (dbUser.role === 'SUPER_ADMIN') {
    // Get upcoming application deadlines
    const upcomingDeadlines = await prisma.application.findMany({
      where: {
        university: {
          applicationDeadline: {
            gt: new Date(),
            lte: new Date(new Date().setDate(new Date().getDate() + 7))
          }
        }
      },
      include: {
        studentProfile: { include: { user: true } },
        university: true
      },
      take: 10
    });

    upcomingDeadlines.forEach(app => {
      const daysUntil = Math.ceil((new Date(app.university.applicationDeadline!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      alerts.push({
        type: 'deadline',
        message: `${app.studentProfile.user.name}'ın ${app.university.name} başvurusunun son tarihi ${daysUntil} gün sonra`,
        urgency: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low'
      });
    });

    // Get missing documents
    const missingDocuments = await prisma.document.findMany({
      where: {
        status: 'MISSING'
      },
      include: {
        application: {
          include: {
            studentProfile: { include: { user: true } }
          }
        }
      },
      take: 10
    });

    missingDocuments.forEach((doc: any) => {
      alerts.push({
        type: 'document',
        message: `${doc.application.studentProfile.user.name}'ın ${doc.documentType} eksik`,
        urgency: 'medium'
      });
    });

  // ADVISOR sees alerts for their assigned students
  } else if (dbUser.role === 'ADVISOR') {
    const advisorProfile = await prisma.advisorProfile.findUnique({
      where: { userId: dbUser.id },
      include: {
        students: {
          include: {
            user: true,
            applications: {
              include: {
                university: true
              }
            }
          }
        }
      }
    });

    if (advisorProfile) {
      advisorProfile.students.forEach(student => {
        // Check application deadlines
        student.applications.forEach(app => {
          if (app.university.applicationDeadline) {
            const deadline = new Date(app.university.applicationDeadline);
            const daysUntil = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntil > 0 && daysUntil <= 7) {
              alerts.push({
                type: 'deadline',
                message: `${student.user.name}'ın ${app.university.name} başvurusunun son tarihi ${daysUntil} gün sonra`,
                urgency: daysUntil <= 2 ? 'high' : daysUntil <= 5 ? 'medium' : 'low'
              });
            }
          }
        });
      });
    }
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  // Show only top 5 alerts
  alerts = alerts.slice(0, 5);

  if (alerts.length === 0) {
    return null;
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'visa':
        return <Calendar className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, index) => (
        <Alert key={index} className={getAlertColor(alert.urgency)}>
          {getAlertIcon(alert.type)}
          <AlertTitle className="text-sm font-semibold">
            {alert.urgency === 'high' ? 'Acil' : alert.urgency === 'medium' ? 'Dikkat' : 'Bilgi'}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {alert.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
