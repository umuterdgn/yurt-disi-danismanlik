"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, Clock, CheckCircle, AlertCircle, Building2, Globe, User } from "lucide-react";

interface VisaProcess {
  id: string;
  status: string;
  appointmentDate?: Date | string;
  missingDocuments?: string[];
  application: {
    id: string;
    universityName?: string;
    country?: string;
    program: string;
    studentProfile: {
      user: {
        name: string;
      };
    };
  };
}

interface VisaKanbanBoardProps {
  visaProcesses: VisaProcess[];
}

const VISA_COLUMNS = [
  { status: 'OFFER_RECEIVED', label: 'Offer Alındı', color: 'bg-blue-50 border-blue-200', icon: <CheckCircle className="w-4 h-4" /> },
  { status: 'DEPOSIT_PAID', label: 'Depozito Ödendi', color: 'bg-green-50 border-green-200', icon: <CheckCircle className="w-4 h-4" /> },
  { status: 'DOCUMENTS_PREPARING', label: 'Vize Evrakları Hazırlanıyor', color: 'bg-yellow-50 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  { status: 'APPOINTMENT_SCHEDULED', label: 'Randevu Alındı', color: 'bg-purple-50 border-purple-200', icon: <Calendar className="w-4 h-4" /> },
  { status: 'RESULT_PENDING', label: 'Sonuç Bekleniyor', color: 'bg-orange-50 border-orange-200', icon: <Clock className="w-4 h-4" /> },
  { status: 'APPROVED', label: 'Onaylandı', color: 'bg-green-100 border-green-300', icon: <CheckCircle className="w-4 h-4" /> },
  { status: 'REJECTED', label: 'Reddedildi', color: 'bg-red-50 border-red-200', icon: <AlertCircle className="w-4 h-4" /> },
];

export function VisaKanbanBoard({ visaProcesses }: VisaKanbanBoardProps) {
  const [processes, setProcesses] = useState(visaProcesses);

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // In a real implementation, this would update the database
    // For now, we'll just update the local state
    const updatedProcesses = [...processes];
    const [movedProcess] = updatedProcesses.splice(source.index, 1);
    updatedProcesses.splice(destination.index, 0, movedProcess);
    
    // Update the status
    const newStatus = VISA_COLUMNS[destination.droppableId].status;
    const processIndex = updatedProcesses.findIndex(p => p.id === movedProcess.id);
    if (processIndex !== -1) {
      updatedProcesses[processIndex] = {
        ...updatedProcesses[processIndex],
        status: newStatus
      };
    }
    
    setProcesses(updatedProcesses);
  };

  const getProcessesByStatus = (status: string) => {
    return processes.filter(p => p.status === status);
  };

  const getStatusBadge = (status: string) => {
    const column = VISA_COLUMNS.find(c => c.status === status);
    if (!column) return <Badge variant="outline">{status}</Badge>;
    
    return (
      <Badge className={column.color.replace('bg-', 'bg-opacity-100 ')}>
        {column.icon}
        <span className="ml-1">{column.label}</span>
      </Badge>
    );
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {VISA_COLUMNS.map((column, columnIndex) => (
          <div key={column.status} className={`${column.color} rounded-lg p-4 min-h-[400px]`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {column.icon}
                {column.label}
              </h3>
              <Badge variant="outline" className="text-xs">
                {getProcessesByStatus(column.status).length}
              </Badge>
            </div>

            <Droppable droppableId={columnIndex.toString()}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-3 min-h-[300px]"
                >
                  {getProcessesByStatus(column.status).map((process, index) => (
                    <Draggable
                      key={process.id}
                      draggableId={process.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <Card className="shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm font-medium">
                                {process.application.studentProfile.user.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Building2 className="w-3 h-3" />
                                <span>{process.application.universityName || 'Üniversite'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Globe className="w-3 h-3" />
                                <span>{process.application.country || 'Ülke'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <User className="w-3 h-3" />
                                <span>{process.application.program}</span>
                              </div>
                              
                              {process.appointmentDate && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>Randevu: {formatDate(process.appointmentDate)}</span>
                                </div>
                              )}

                              {process.missingDocuments && process.missingDocuments.length > 0 && (
                                <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                  <p className="text-xs font-medium text-red-900 mb-1">
                                    Eksik Belgeler:
                                  </p>
                                  <ul className="text-xs text-red-700 list-disc list-inside">
                                    {process.missingDocuments.slice(0, 2).map((doc, i) => (
                                      <li key={i}>{doc}</li>
                                    ))}
                                    {process.missingDocuments.length > 2 && (
                                      <li>+{process.missingDocuments.length - 2} daha</li>
                                    )}
                                  </ul>
                                </div>
                              )}

                              <div className="pt-2 border-t">
                                {getStatusBadge(process.status)}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}