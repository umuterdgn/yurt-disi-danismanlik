"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addMeeting } from "@/actions/add-meeting";
import { createZoomMeeting } from "@/actions/zoom";
import { Plus, Video } from "lucide-react";
import { toast } from "sonner";

interface AddMeetingDialogProps {
  students: { id: string; name: string }[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedStudentId?: string;
}

export function AddMeetingDialog({ students, open: controlledOpen, onOpenChange, selectedStudentId }: AddMeetingDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [error, setError] = useState("");
  const [zoomLink, setZoomLink] = useState("");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  async function handleCreateZoom(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setZoomLoading(true);
    
    const form = e.currentTarget.closest('form') as HTMLFormElement;
    const formData = new FormData(form);
    
    const studentId = formData.get('studentProfileId') as string;
    const meetingDate = formData.get('meetingDate') as string;
    const duration = formData.get('duration') as string;
    
    const student = students.find(s => s.id === studentId);
    
    const result = await createZoomMeeting({
      topic: `Görüşme - ${student?.name}`,
      start_time: meetingDate,
      duration: parseInt(duration) || 60
    });
    
    if (result.success) {
      toast.success("Zoom toplantısı oluşturuldu!");
      setZoomLink(result.zoomLink || "");
      setZoomLoading(false);
    } else {
      toast.error(result.error || "Zoom toplantısı oluşturulamadı");
      setError(result.error || "Zoom toplantısı oluşturulamadı");
      setZoomLoading(false);
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError("");
    
    if (zoomLink) {
      formData.set('zoomLink', zoomLink);
    }
    
    const result = await addMeeting(formData);
    
    if (result.success) {
      toast.success("Görüşme notu başarıyla eklendi!");
      setOpen(false);
      setZoomLink("");
      window.location.reload();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Görüşme Planla
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Yeni Görüşme Planla</DialogTitle>
          <DialogDescription>
            Öğrenci ile görüşme planlayın ve Zoom toplantısı oluşturun.
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="studentProfileId" className="text-right">
                Öğrenci
              </Label>
              <Select name="studentProfileId" required defaultValue={selectedStudentId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meetingDate" className="text-right">
                Tarih
              </Label>
              <Input
                id="meetingDate"
                name="meetingDate"
                type="datetime-local"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">
                Süre (dk)
              </Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                defaultValue="60"
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="motivationLevel" className="text-right">
                Motivasyon
              </Label>
              <Select name="motivationLevel" required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="medium">Orta</SelectItem>
                  <SelectItem value="high">Yüksek</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="issues" className="text-right">
                Sorunlar
              </Label>
              <Textarea
                id="issues"
                name="issues"
                placeholder="Öğrencinin yaşadığı sorunlar..."
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="achievements" className="text-right">
                Başarılar
              </Label>
              <Textarea
                id="achievements"
                name="achievements"
                placeholder="Öğrencinin başarıları..."
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="actionItems" className="text-right">
                Aksiyonlar
              </Label>
              <Textarea
                id="actionItems"
                name="actionItems"
                placeholder="Atılacak adımlar..."
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nextMeetingDate" className="text-right">
                Sonraki Görüşme
              </Label>
              <Input
                id="nextMeetingDate"
                name="nextMeetingDate"
                type="datetime-local"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notlar
              </Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Ek notlar..."
                className="col-span-3"
                rows={2}
              />
            </div>
            
            {zoomLink && (
              <div className="col-span-4 bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-green-700">
                  <Video className="w-4 h-4" />
                  <span className="text-sm font-medium">Zoom Link Oluşturuldu:</span>
                </div>
                <a href={zoomLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline break-all">
                  {zoomLink}
                </a>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          
          <DialogFooter className="flex-col gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={(e) => handleCreateZoom(e)}
              disabled={zoomLoading || zoomLink !== ""}
              className="w-full"
            >
              {zoomLoading ? "Oluşturuluyor..." : (
                <>
                  <Video className="w-4 h-4 mr-2" />
                  Zoom Toplantısı Oluştur
                </>
              )}
            </Button>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Kaydediliyor..." : "Görüşmeyi Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
