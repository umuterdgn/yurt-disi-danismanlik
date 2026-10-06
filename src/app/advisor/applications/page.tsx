import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, CheckCircle, AlertCircle, Building2, Globe, Calendar } from 'lucide-react';
import { updateApplicationStatus } from "@/actions/update-application-status";
import { KanbanBoard } from "@/components/kanban-board";
import { ApplicationAddDialog } from "@/components/application-add-dialog";

const KANBAN_COLUMNS = [
  { status: 'INITIAL_INTERVIEW', label: 'Ön Görüşme', color: 'bg-blue-50 border-blue-200' },
  { status: 'DOCUMENT_COLLECTION', label: 'Evrak Toplama', color: 'bg-yellow-50 border-yellow-200' },
  { status: 'SUBMITTED', label: 'Başvuru Yapıldı', color: 'bg-purple-50 border-purple-200' },
  { status: 'ACCEPTED', label: 'Kabul Edildi', color: 'bg-green-50 border-green-200' },
  { status: 'PAYMENT', label: 'Ödeme Bekliyor', color: 'bg-orange-50 border-orange-200' },
  { status: 'VISA', label: 'Vize Sürecinde', color: 'bg-red-50 border-red-200' },
  { status: 'ACCOMMODATION', label: 'Konaklama', color: 'bg-indigo-50 border-indigo-200' },
  { status: 'COMPLETED', label: 'Tamamlandı', color: 'bg-gray-50 border-gray-200' },
];

export default async function AdvisorApplicationsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_id')?.value;
  const userRole = cookieStore.get('user_role')?.value;

  let advisorProfileId = null;
  if (userId) {
    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          advisorProfile: true
        }
      });
      if (dbUser) {
        advisorProfileId = dbUser.advisorProfile?.id;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  // Get students for the dialog (filtered by role)
  const students = await prisma.studentProfile.findMany({
    select: {
      id: true,
      user: { select: { name: true } }
    },
    where: userRole === 'SUPER_ADMIN' ? {} : { advisorId: advisorProfileId }
  });

  // Get universities for the dialog
  const universities = await prisma.university.findMany({
    select: {
      id: true,
      name: true
    }
  });

  const applications = await prisma.application.findMany({
    include: {
      studentProfile: {
        include: { user: true }
      },
      university: {
        include: { country: true }
      }
    },
    where: userRole === 'SUPER_ADMIN' ? {} : { studentProfile: { advisorId: advisorProfileId } },
    orderBy: { updatedAt: 'desc' }
  });

  // Convert Date objects to strings for client-side
  // @ts-ignore
  const serializedApplications = applications.map((app: any) => ({
    ...app,
    createdAt: app.createdAt?.toISOString() || null,
    updatedAt: app.updatedAt?.toISOString() || null,
    applicationDate: app.applicationDate?.toISOString() || null,
    deadline: app.deadline?.toISOString() || null,
  }));

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Başvuru Takibi</h1>
            <p className="text-gray-600 mt-1">Öğrenci başvuru süreçlerini yönetin</p>
          </div>
          <ApplicationAddDialog students={students} universities={universities} />
        </div>
        <KanbanBoard applications={serializedApplications} columns={KANBAN_COLUMNS} />
      </div>
    </div>
  );
}
