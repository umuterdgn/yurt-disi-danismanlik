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
import { createApplication } from "@/actions/advisor-crud"

interface ApplicationAddDialogProps {
  studentId?: string
  students?: any[]
}

export function ApplicationAddDialog({ studentId, students }: ApplicationAddDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState(studentId || "")
  const [formData, setFormData] = useState({
    universityId: "",
    program: "",
    semester: "",
    year: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = new FormData()
    data.append("studentProfileId", selectedStudentId)
    data.append("universityId", formData.universityId)
    data.append("program", formData.program)
    data.append("semester", formData.semester)
    data.append("year", formData.year)

    const result = await createApplication(data)
    
    setIsSubmitting(false)
    
    if (result.success) {
      setOpen(false)
      setFormData({
        universityId: "",
        program: "",
        semester: "",
        year: ""
      })
      alert("Başvuru başarıyla başlatıldı!")
    } else {
      alert(result.error || "Bir hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Başvuru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Yeni Başvuru Başlat</DialogTitle>
          <DialogDescription>
            Öğrenci için yeni bir yurt dışı eğitim başvurusu başlatın.
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
              <Label htmlFor="university">Üniversite</Label>
              <Select
                value={formData.universityId}
                onValueChange={(value) => setFormData({ ...formData, universityId: value })}
              >
                <SelectTrigger id="university">
                  <SelectValue placeholder="Üniversite seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mit">MIT (Massachusetts Institute of Technology)</SelectItem>
                  <SelectItem value="stanford">Stanford University</SelectItem>
                  <SelectItem value="harvard">Harvard University</SelectItem>
                  <SelectItem value="oxford">University of Oxford</SelectItem>
                  <SelectItem value="cambridge">University of Cambridge</SelectItem>
                  <SelectItem value="eth">ETH Zurich</SelectItem>
                  <SelectItem value="caltech">California Institute of Technology</SelectItem>
                  <SelectItem value="imperial">Imperial College London</SelectItem>
                  <SelectItem value="ucl">UCL (University College London)</SelectItem>
                  <SelectItem value="toronto">University of Toronto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="program">Program</Label>
              <Select
                value={formData.program}
                onValueChange={(value) => setFormData({ ...formData, program: value })}
              >
                <SelectTrigger id="program">
                  <SelectValue placeholder="Program seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lisans">Lisans (Bachelor's)</SelectItem>
                  <SelectItem value="Yüksek Lisans">Yüksek Lisans (Master's)</SelectItem>
                  <SelectItem value="Doktora">Doktora (PhD)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="semester">Dönem</Label>
              <Select
                value={formData.semester}
                onValueChange={(value) => setFormData({ ...formData, semester: value })}
              >
                <SelectTrigger id="semester">
                  <SelectValue placeholder="Dönem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fall">Fall (Sonbahar)</SelectItem>
                  <SelectItem value="Spring">Spring (İlkbahar)</SelectItem>
                  <SelectItem value="Summer">Summer (Yaz)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="year">Yıl</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="Örn: 2025"
                min="2024"
                max="2030"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Başlatılıyor..." : "Başlat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}