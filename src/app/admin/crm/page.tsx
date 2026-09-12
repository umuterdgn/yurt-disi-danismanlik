"use client";

import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserPlus, Phone, Mail, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  service: string;
  status: string;
  notes?: string;
  createdAt: string;
  assignedAdvisor?: {
    id: string;
    user: {
      name: string;
    };
  };
}

interface Column {
  id: string;
  title: string;
  status: string;
  leads: Lead[];
}

const COLUMNS: { id: string; title: string; status: string }[] = [
  { id: "new", title: "Yeni", status: "NEW" },
  { id: "contacted", title: "İletişim Kuruldu", status: "CONTACTED" },
  { id: "meeting", title: "Toplantı Planlandı", status: "MEETING_SET" },
  { id: "won", title: "Kazanıldı", status: "WON" },
  { id: "lost", title: "Kaybedildi", status: "LOST" },
];

const SOURCE_OPTIONS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "WEBSITE", label: "Web Sitesi" },
  { value: "REFERRAL", label: "Referans" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "TWITTER", label: "Twitter" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "GOOGLE", label: "Google" },
  { value: "OTHER", label: "Diğer" },
];

const SERVICE_OPTIONS = [
  { value: "YKS", label: "YKS" },
  { value: "STUDY_ABROAD", label: "Yurt Dışı" },
  { value: "LANGUAGE_SCHOOL", label: "Dil Okulu" },
  { value: "CONSULTING", label: "Danışmanlık" },
  { value: "OTHER", label: "Diğer" },
];

export default function CRMPage() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    source: "WEBSITE",
    service: "STUDY_ABROAD",
    notes: "",
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/leads");
      if (!response.ok) throw new Error("Failed to fetch leads");
      const leads: Lead[] = await response.json();

      const groupedColumns = COLUMNS.map((col) => ({
        ...col,
        leads: leads.filter((lead) => lead.status === col.status),
      }));

      setColumns(groupedColumns);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Lead'ler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId) return;

    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    const lead = sourceColumn.leads.find((l) => l.id === draggableId);
    if (!lead) return;

    const newStatus = destColumn.status;

    try {
      const response = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update lead status");

      // Update local state
      const newColumns = columns.map((col) => {
        if (col.id === source.droppableId) {
          return {
            ...col,
            leads: col.leads.filter((l) => l.id !== draggableId),
          };
        }
        if (col.id === destination.droppableId) {
          return {
            ...col,
            leads: [...col.leads, { ...lead, status: newStatus }],
          };
        }
        return col;
      });

      setColumns(newColumns);
      toast.success("Lead durumu güncellendi");
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Lead durumu güncellenirken hata oluştu");
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });

      if (!response.ok) throw new Error("Failed to create lead");

      toast.success("Lead başarıyla oluşturuldu");
      setIsAddDialogOpen(false);
      setNewLead({
        name: "",
        email: "",
        phone: "",
        source: "WEBSITE",
        service: "STUDY_ABROAD",
        notes: "",
      });
      fetchLeads();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast.error("Lead oluşturulurken hata oluştu");
    }
  };

  const handleConvertToStudent = async (lead: Lead) => {
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to convert lead to student");

      toast.success("Lead öğrenciye dönüştürüldü");
      fetchLeads();
    } catch (error) {
      console.error("Error converting lead to student:", error);
      toast.error("Öğrenciye dönüştürme işlemi başarısız");
    }
  };

  const getSourceLabel = (source: string) => {
    return SOURCE_OPTIONS.find((opt) => opt.value === source)?.label || source;
  };

  const getServiceLabel = (service: string) => {
    return SERVICE_OPTIONS.find((opt) => opt.value === service)?.label || service;
  };

  const getColumnColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-50 border-blue-200";
      case "CONTACTED":
        return "bg-yellow-50 border-yellow-200";
      case "MEETING_SET":
        return "bg-purple-50 border-purple-200";
      case "WON":
        return "bg-green-50 border-green-200";
      case "LOST":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-96 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Satış CRM</h1>
            <p className="text-gray-600 mt-2">Lead yönetimi ve satış süreci takibi</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Yeni Lead Ekle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yeni Lead Ekle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddLead} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ad Soyad
                  </label>
                  <Input
                    required
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    placeholder="Ahmet Yılmaz"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta
                  </label>
                  <Input
                    required
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="ahmet@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <Input
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="+90 555 123 4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kaynak
                  </label>
                  <Select
                    value={newLead.source}
                    onValueChange={(value) => setNewLead({ ...newLead, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hizmet
                  </label>
                  <Select
                    value={newLead.service}
                    onValueChange={(value) => setNewLead({ ...newLead, service: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notlar
                  </label>
                  <Textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    placeholder="Ek bilgiler..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit">Lead Ekle</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {columns.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className={`p-4 rounded-t-lg border-t-2 border-l-2 border-r-2 ${getColumnColor(column.status)}`}>
                  <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {column.leads.length}
                    </Badge>
                  </h3>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-3 space-y-3 min-h-[400px] border-l-2 border-r-2 border-b-2 rounded-b-lg ${getColumnColor(column.status)} ${
                        snapshot.isDraggingOver ? "bg-opacity-80" : ""
                      }`}
                    >
                      {column.leads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg shadow-sm p-4 cursor-move transition-shadow ${
                                snapshot.isDragging ? "shadow-lg" : "hover:shadow-md"
                              }`}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-medium text-gray-900">{lead.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {getServiceLabel(lead.service)}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <span className="truncate">{lead.email}</span>
                                </div>
                                {lead.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-3 h-3" />
                                    <span>{lead.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(lead.createdAt).toLocaleDateString("tr-TR")}</span>
                                </div>
                                <div className="text-xs text-gray-500">
                                  Kaynak: {getSourceLabel(lead.source)}
                                </div>
                                {lead.assignedAdvisor && (
                                  <div className="text-xs text-gray-500">
                                    Danışman: {lead.assignedAdvisor.user.name}
                                  </div>
                                )}
                                {column.status === "WON" && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    className="w-full mt-2"
                                    onClick={() => handleConvertToStudent(lead)}
                                  >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Öğrenciye Dönüştür
                                  </Button>
                                )}
                              </div>
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
      </div>
    </div>
  );
}