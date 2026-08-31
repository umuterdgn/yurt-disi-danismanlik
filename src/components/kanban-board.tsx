"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, CheckCircle, AlertCircle, Building2, Globe, Calendar } from 'lucide-react';
import { updateApplicationStatus } from "@/actions/update-application-status";

interface Application {
  id: string;
  status: string;
  applicationDate: string | null;
  studentProfile: {
    user: {
      name: string;
    };
  };
  university: {
    name: string;
    country: {
      code: string;
    };
  };
}

interface Column {
  status: string;
  label: string;
  color: string;
}

interface KanbanBoardProps {
  applications: Application[];
  columns: Column[];
}

function ApplicationCard({ application, allStatuses, columns }: { 
  application: Application; 
  allStatuses: string[];
  columns: Column[];
}) {
  return (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {application.studentProfile.user.name}
              </p>
              <p className="text-xs text-gray-600 mt-1 truncate">
                {application.university.name}
              </p>
            </div>
            <Badge className="text-xs bg-blue-100 text-blue-700 flex-shrink-0 ml-2">
              {application.university.country.code}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {application.applicationDate 
                ? new Date(application.applicationDate).toLocaleDateString('tr-TR')
                : '-'}
            </span>
          </div>
          
          <div className="pt-2 border-t">
            <Select 
              defaultValue={application.status} 
              onValueChange={async (value) => {
                await updateApplicationStatus(application.id, value as any);
                window.location.reload();
              }}
            >
              <SelectTrigger className="w-full text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {columns.find(c => c.status === status)?.label || status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KanbanBoard({ applications, columns }: KanbanBoardProps) {
  const getApplicationsByStatus = (status: string) => {
    return applications.filter(app => app.status === status);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'INITIAL_INTERVIEW':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'DOCUMENT_COLLECTION':
        return <FileText className="w-4 h-4 text-yellow-600" />;
      case 'SUBMITTED':
        return <Building2 className="w-4 h-4 text-purple-600" />;
      case 'ACCEPTED':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'PAYMENT':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'VISA':
        return <Globe className="w-4 h-4 text-red-600" />;
      case 'ACCOMMODATION':
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const allStatuses = columns.map(c => c.status);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div className="w-full">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Başvuru Takibi - Kanban Pano</h1>
          <p className="text-gray-600 mt-1 md:mt-2 text-sm md:text-base">Başvuru durumlarını takip edin</p>
        </div>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto pb-4 flex-nowrap -mx-4 md:mx-0 px-4 md:px-0">
        {columns.map((column) => {
          const columnApps = getApplicationsByStatus(column.status);
          return (
            <div key={column.status} className={`flex-shrink-0 min-w-[280px] w-[280px] md:w-80 ${column.color} border rounded-lg p-3 md:p-4`}>
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(column.status)}
                  <h3 className="font-semibold text-gray-900 text-xs md:text-sm">{column.label}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {columnApps.length}
                </Badge>
              </div>
              
              <div className="space-y-2 md:space-y-3">
                {columnApps.map((application) => (
                  <ApplicationCard 
                    key={application.id} 
                    application={application} 
                    allStatuses={allStatuses}
                    columns={columns}
                  />
                ))}
                
                {columnApps.length === 0 && (
                  <div className="text-center py-6 md:py-8 text-gray-500 text-xs">
                    Bu aşamada başvuru yok
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
