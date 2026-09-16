"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { rescheduleMeeting } from "@/actions/add-meeting";

interface RescheduleMeetingDialogProps {
  meetingId: string;
  currentMeetingDate: string;
  studentName: string;
}

export function RescheduleMeetingDialog({ meetingId, currentMeetingDate, studentName }: RescheduleMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newDate, setNewDate] = useState(currentMeetingDate.split('T')[0]);
  const [newTime, setNewTime] = useState(currentMeetingDate.split('T')[1]?.slice(0, 5) || '10:00');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await rescheduleMeeting(meetingId, newDate, newTime);

    if (result.success) {
      toast.success("Görüşme başarıyla ertelendi!");
      setOpen(false);
      window.location.reload();
    } else {
      toast.error(result.error || "Bir hata oluştu");
      setError(result.error || "Bir hata oluştu");
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="w-4 h-4 mr-2" />
          Ertele / Yeniden Planla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Görüşmeyi Ertele / Yeniden Planla</DialogTitle>
          <DialogDescription>
            {studentName} ile görüşme tarihini ve saatini güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newDate" className="text-right">
                Yeni Tarih
              </Label>
              <Input
                id="newDate"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newTime" className="text-right">
                Yeni Saat
              </Label>
              <Input
                id="newTime"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="flex items-center space-x-2 text-blue-700">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Mevcut Tarih:</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                {new Date(currentMeetingDate).toLocaleDateString('tr-TR')} - {new Date(currentMeetingDate).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
              </p>
            </div>
          </div>
          
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? "Güncelleniyor..." : "Görüşmeyi Güncelle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}