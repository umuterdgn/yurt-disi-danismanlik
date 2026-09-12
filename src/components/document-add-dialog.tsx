"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { createDocument } from "@/actions/advisor-crud"

interface DocumentAddDialogProps {
  studentId?: string
  applications?: any[]
  students?: any[]
}

export function DocumentAddDialog({ studentId, applications, students }: DocumentAddDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "")
  const [formData, setFormData] = useState({
    applicationId: "",
    documentType: "",
    documentName: "",
    filePath: "",
    expiryDate: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStudentId) {
      alert("Lütfen bir öğrenci seçin")
      return
    }
    
    if (!formData.applicationId) {
      alert("Lütfen bir başvuru seçin")
      return
    }
    
    setIsSubmitting(true)

    const data = new FormData()
    data.append("studentProfileId", selectedStudentId)
    data.append("applicationId", formData.applicationId)
    data.append("documentType", formData.documentType)
    data.append("documentName", formData.documentName)
    data.append("filePath", formData.filePath)
    data.append("expiryDate", formData.expiryDate)

    const result = await createDocument(data)
    
    setIsSubmitting(false)
    
    if (result.success) {
      setOpen(false)
      setFormData({
        applicationId: "",
        documentType: "",
        documentName: "",
        filePath: "",
        expiryDate: ""
      })
      alert("Evrak başarıyla eklendi!")
      window.location.reload()
    } else {
      alert(result.error || "Bir hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Evrak Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Evrak Ekle</DialogTitle>
          <DialogDescription>
            Öğrenci adına yeni bir evrak belgesi ekleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {students && !studentId && (
              <div className="grid gap-2">
                <Label htmlFor="student">Öğrenci</Label>
                <Select
                  value={selectedStudentId}
                  onValueChange={(value) => setSelectedStudentId(value)}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Öğrenci seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.user?.name || student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="application">Başvuru</Label>
              <Select
                value={formData.applicationId}
                onValueChange={(value) => setFormData({ ...formData, applicationId: value })}
              >
                <SelectTrigger id="application">
                  <SelectValue placeholder="Başvuru seçin" />
                </SelectTrigger>
                <SelectContent>
                  {applications && applications.length > 0 ? (
                    applications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        {app.university?.name || 'Başvuru'} - {app.program}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>Başvuru bulunmuyor</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documentType">Evrak Tipi</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value) => setFormData({ ...formData, documentType: value })}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Evrak tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pasaport">Pasaport</SelectItem>
                  <SelectItem value="Diploma">Diploma</SelectItem>
                  <SelectItem value="Transkript">Transkript</SelectItem>
                  <SelectItem value="Motivation Mektubu">Motivation Mektubu</SelectItem>
                  <SelectItem value="CV">CV</SelectItem>
                  <SelectItem value="Referans Mektubu">Referans Mektubu</SelectItem>
                  <SelectItem value="Dil Sertifikası">Dil Sertifikası</SelectItem>
                  <SelectItem value="Maaş Beyanı">Maaş Beyanı</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="documentName">Evrak Adı</Label>
              <Input
                id="documentName"
                value={formData.documentName}
                onChange={(e) => setFormData({ ...formData, documentName: e.target.value })}
                placeholder="Örn: İngilizce Pasaport"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="filePath">Dosya Yolu (Opsiyonel)</Label>
              <Input
                id="filePath"
                value={formData.filePath}
                onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                placeholder="Supabase Storage URL"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expiryDate">Son Geçerlilik Tarihi (Opsiyonel)</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Ekleniyor..." : "Ekle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}