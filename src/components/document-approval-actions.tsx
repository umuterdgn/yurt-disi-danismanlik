"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { updateDocumentStatus } from "@/actions/document"

interface DocumentApprovalActionsProps {
  documentId: string
  currentStatus: string
  documentType: string
  studentName: string
}

export function DocumentApprovalActions({
  documentId,
  currentStatus,
  documentType,
  studentName
}: DocumentApprovalActionsProps) {
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    const result = await updateDocumentStatus(documentId, 'APPROVED')
    setIsProcessing(false)
    
    if (result.success) {
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  const handleRevisionRequest = async () => {
    if (!feedback.trim()) {
      alert("Lütfen revizyon sebebi girin")
      return
    }

    setIsProcessing(true)
    const result = await updateDocumentStatus(documentId, 'REVISION_REQUIRED', feedback)
    setIsProcessing(false)
    
    if (result.success) {
      setIsRevisionModalOpen(false)
      setFeedback("")
      window.location.reload()
    } else {
      alert(result.error)
    }
  }

  // Only show actions for pending/uploaded documents
  if (currentStatus !== 'PENDING' && currentStatus !== 'UPLOADED') {
    return (
      <Badge 
        variant={currentStatus === 'APPROVED' ? "default" : "destructive"}
        className="text-xs"
      >
        {currentStatus === 'APPROVED' ? 'Onaylandı' : 'Revizyon Gerekiyor'}
      </Badge>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="default"
        className="bg-green-600 hover:bg-green-700"
        onClick={handleApprove}
        disabled={isProcessing}
      >
        <CheckCircle className="w-4 h-4 mr-1" />
        Onayla
      </Button>

      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={isProcessing}
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            Revizyon İste
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revizyon İste</DialogTitle>
            <DialogDescription>
              {studentName} öğrencisinin {documentType} evrağı için revizyon sebebi girin.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Örn: Pasaport fotoğrafı çok bulanık, lütfen net çek..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
            className="mt-4"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRevisionModalOpen(false)}
              disabled={isProcessing}
            >
              <X className="w-4 h-4 mr-1" />
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevisionRequest}
              disabled={isProcessing}
            >
              Revizyon Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}