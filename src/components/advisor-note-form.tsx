"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send } from "lucide-react";
import { addAdvisorNote } from "@/actions/admin";
import { toast } from "sonner";

interface AdvisorNoteFormProps {
  studentId: string;
  currentNote?: string | null;
}

export function AdvisorNoteForm({ studentId, currentNote }: AdvisorNoteFormProps) {
  const [note, setNote] = useState(currentNote || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!note.trim()) {
      toast.error("Not boş olamaz");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addAdvisorNote(studentId, note);
      
      if (result.success) {
        toast.success("Not başarıyla eklendi", {
          description: "Öğrenci dashboard'unda görünecek"
        });
      } else {
        toast.error("Hata", {
          description: result.error || "Not eklenirken bir hata oluştu"
        });
      }
    } catch (error) {
      console.error('Note submission error:', error);
      toast.error("Hata", {
        description: "Not eklenirken bir hata oluştu"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-900">
          <MessageSquare className="w-5 h-5" />
          Öğrenciye Not Bırak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Öğrenciye motivasyon notu, çalışma tavsiyesi veya özel mesaj bırakın..."
            rows={4}
            className="bg-white border-yellow-300 focus:border-yellow-500"
          />
          <div className="flex justify-between items-center">
            <p className="text-sm text-yellow-700">
              Bu not öğrencinin dashboard'unda sarı bir yapışkan not olarak görünecek
            </p>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isSubmitting ? (
                "Gönderiliyor..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Not Gönder
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}