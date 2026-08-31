import { prisma } from "@/lib/prisma";
import { ApplicationStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, CheckCircle, AlertCircle, Building2, Globe, Calendar } from 'lucide-react';
import { updateApplicationStatus } from "@/actions/update-application-status";
import { KanbanBoard } from "@/components/kanban-board";

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
  const applications = await prisma.application.findMany({
    include: {
      studentProfile: {
        include: { user: true }
      },
      university: {
        include: { country: true }
      }
    },
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

  return <KanbanBoard applications={serializedApplications} columns={KANBAN_COLUMNS} />;
}
