"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createMeetingNote } from "@/actions/advisor-crud"

interface MeetingNoteFormProps {
  studentId: string
}

export function MeetingNoteForm({ studentId }: MeetingNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    meetingDate: new Date().toISOString().split('T')[0],
    duration: "30",
    motivationLevel: "",
    issues: "",
    achievements: "",
    actionItems: "",
    notes: "",
    nextMeetingDate: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData()
    data.append("studentProfileId", studentId)
    data.append("meetingDate", formData.meetingDate)
    data.append("duration", formData.duration)
    data.append("motivationLevel", formData.motivationLevel)
    data.append("issues", formData.issues)
    data.append("achievements", formData.achievements)
    data.append("actionItems", formData.actionItems)
    data.append("notes", formData.notes)
    data.append("nextMeetingDate", formData.nextMeetingDate)

    const result = await createMeetingNote(data)
    
    setIsSubmitting(false)
    
    if (result.success) {
      setFormData({
        meetingDate: new Date().toISOString().split('T')[0],
        duration: "30",
        motivationLevel: "",
        issues: "",
        achievements: "",
        actionItems: "",
        notes: "",
        nextMeetingDate: ""
      })
      alert("Görüşme notu başarıyla eklendi!")
      window.location.reload()
    } else {
      alert(result.error || "Bir hata oluştu")
    }
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold mb-3">Yeni Görüşme Notu Ekle</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="meetingDate">Tarih</Label>
            <Input
              id="meetingDate"
              type="date"
              value={formData.meetingDate}
              onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="duration">Süre (Dakika)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="motivationLevel">Motivasyon Seviyesi</Label>
          <Select
            value={formData.motivationLevel}
            onValueChange={(value) => setFormData({ ...formData, motivationLevel: value })}
          >
            <SelectTrigger id="motivationLevel">
              <SelectValue placeholder="Seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Düşük</SelectItem>
              <SelectItem value="medium">Orta</SelectItem>
              <SelectItem value="high">Yüksek</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="issues">Sorunlar</Label>
          <Textarea
            id="issues"
            value={formData.issues}
            onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
            placeholder="Öğrencinin yaşadığı sorunlar..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="achievements">Başarılar</Label>
          <Textarea
            id="achievements"
            value={formData.achievements}
            onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
            placeholder="Öğrencinin başarıları..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="actionItems">Atılacak Adımlar</Label>
          <Textarea
            id="actionItems"
            value={formData.actionItems}
            onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
            placeholder="Bir sonraki görüşmeye kadar yapılacaklar..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="notes">Görüşme Notları</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Görüşme detayları..."
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="nextMeetingDate">Sonraki Görüşme Tarihi (Opsiyonel)</Label>
          <Input
            id="nextMeetingDate"
            type="date"
            value={formData.nextMeetingDate}
            onChange={(e) => setFormData({ ...formData, nextMeetingDate: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Ekleniyor..." : "Not Ekle"}
        </Button>
      </form>
    </div>
  )
}