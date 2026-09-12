"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, Zap, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  actions: WorkflowAction[];
  createdAt: string;
}

interface WorkflowAction {
  id: string;
  actionType: string;
  payload: string;
  order: number;
}

const TRIGGER_OPTIONS = [
  { value: "NEW_STUDENT", label: "Yeni Öğrenci Kaydı" },
  { value: "DOC_REJECTED", label: "Belge Reddedildi" },
  { value: "APPLICATION_STATUS_CHANGE", label: "Başvuru Durumu Değişti" },
  { value: "TASK_COMPLETED", label: "Görev Tamamlandı" },
  { value: "MEETING_COMPLETED", label: "Görüşme Tamamlandı" },
  { value: "PAYMENT_OVERDUE", label: "Ödeme Gecikti" },
  { value: "RISK_STATUS_CHANGE", label: "Risk Durumu Değişti" },
];

const ACTION_OPTIONS = [
  { value: "CREATE_TASK", label: "Görev Oluştur" },
  { value: "SEND_WHATSAPP", label: "WhatsApp Gönder" },
  { value: "SEND_EMAIL", label: "E-posta Gönder" },
  { value: "ASSIGN_ADVISOR", label: "Danışman Ata" },
  { value: "UPDATE_STATUS", label: "Durum Güncelle" },
  { value: "CREATE_NOTIFICATION", label: "Bildirim Oluştur" },
  { value: "TRIGGER_AI_ANALYSIS", label: "AI Analizi Tetikle" },
];

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    trigger: "NEW_STUDENT",
    isActive: true,
    actions: [] as { actionType: string; payload: string }[],
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch("/api/workflows");
      if (!response.ok) throw new Error("Failed to fetch workflows");
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast.error("Workflow'lar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWorkflow),
      });

      if (!response.ok) throw new Error("Failed to create workflow");

      toast.success("Workflow başarıyla oluşturuldu");
      setIsCreateDialogOpen(false);
      setNewWorkflow({
        name: "",
        description: "",
        trigger: "NEW_STUDENT",
        isActive: true,
        actions: [],
      });
      fetchWorkflows();
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Workflow oluşturulurken hata oluştu");
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete workflow");

      toast.success("Workflow silindi");
      fetchWorkflows();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast.error("Workflow silinirken hata oluştu");
    }
  };

  const handleToggleWorkflow = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error("Failed to toggle workflow");

      toast.success("Workflow durumu güncellendi");
      fetchWorkflows();
    } catch (error) {
      console.error("Error toggling workflow:", error);
      toast.error("Workflow durumu güncellenirken hata oluştu");
    }
  };

  const addAction = () => {
    setNewWorkflow({
      ...newWorkflow,
      actions: [
        ...newWorkflow.actions,
        { actionType: "CREATE_TASK", payload: "" },
      ],
    });
  };

  const removeAction = (index: number) => {
    setNewWorkflow({
      ...newWorkflow,
      actions: newWorkflow.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index: number, field: string, value: string) => {
    const updatedActions = [...newWorkflow.actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    setNewWorkflow({ ...newWorkflow, actions: updatedActions });
  };

  const getTriggerLabel = (trigger: string) => {
    return TRIGGER_OPTIONS.find((opt) => opt.value === trigger)?.label || trigger;
  };

  const getActionLabel = (actionType: string) => {
    return ACTION_OPTIONS.find((opt) => opt.value === actionType)?.label || actionType;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">Otomasyonlar (Workflows)</h1>
            <p className="text-gray-600 mt-2">Sistem otomasyon kurallarını yönetin</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Yeni Otomasyon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Otomasyon Oluştur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateWorkflow} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otomasyon Adı
                  </label>
                  <Input
                    required
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    placeholder="Örn: Yeni Öğrenci Karşılama"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <Textarea
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    placeholder="Otomasyonun ne işe yaradığını açıklayın..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tetikleyici (Trigger)
                  </label>
                  <Select
                    value={newWorkflow.trigger}
                    onValueChange={(value) => setNewWorkflow({ ...newWorkflow, trigger: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Aksiyonlar
                    </label>
                    <Button type="button" size="sm" variant="outline" onClick={addAction}>
                      <Plus className="w-4 h-4 mr-1" />
                      Aksiyon Ekle
                    </Button>
                  </div>

                  {newWorkflow.actions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      Henüz aksiyon eklenmedi
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newWorkflow.actions.map((action, index) => (
                        <div key={index} className="flex gap-2 items-start">
                          <div className="flex-1 space-y-2">
                            <Select
                              value={action.actionType}
                              onValueChange={(value) => updateAction(index, "actionType", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ACTION_OPTIONS.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={action.payload}
                              onChange={(e) => updateAction(index, "payload", e.target.value)}
                              placeholder="Payload (JSON formatında)"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAction(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    İptal
                  </Button>
                  <Button type="submit">Otomasyon Oluştur</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {workflows.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg font-medium text-gray-900">Henüz otomasyon bulunmuyor</p>
              <p className="text-sm text-gray-500">Sistemde tanımlı otomasyon kuralı yok.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {workflow.name}
                      </CardTitle>
                      {workflow.description && (
                        <p className="text-sm text-gray-500 mt-1">{workflow.description}</p>
                      )}
                    </div>
                    <Badge variant={workflow.isActive ? "default" : "secondary"}>
                      {workflow.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <span className="text-gray-600">Tetikleyici:</span>
                    <span className="font-medium text-gray-900">
                      {getTriggerLabel(workflow.trigger)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                      <span>Aksiyonlar:</span>
                    </div>
                    <div className="pl-6 space-y-1">
                      {workflow.actions.map((action, index) => (
                        <div key={action.id} className="text-sm">
                          <span className="text-gray-700">{index + 1}. </span>
                          <span className="font-medium text-gray-900">
                            {getActionLabel(action.actionType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleWorkflow(workflow.id, workflow.isActive)}
                    >
                      {workflow.isActive ? "Pasife Al" : "Aktife Et"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}