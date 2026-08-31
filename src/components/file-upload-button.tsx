"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Download, Eye } from "lucide-react";
import { uploadFileToSupabase } from "@/lib/supabase-storage";
import { updateDocumentFile } from "@/actions/update-document-file";
import { toast } from "sonner";

interface FileUploadButtonProps {
  documentId: string;
  fileUrl?: string | null;
  documentName?: string;
  onUploadComplete?: () => void;
}

export function FileUploadButton({ 
  documentId, 
  fileUrl, 
  documentName,
  onUploadComplete 
}: FileUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Dosya boyutu 10MB'den büyük olamaz");
      return;
    }

    setLoading(true);

    try {
      // Upload to Supabase Storage
      const uploadResult = await uploadFileToSupabase(file, 'documents', `student-docs`);
      
      if (!uploadResult.success || !uploadResult.url) {
        toast.error(uploadResult.error || "Dosya yüklenemedi");
        setLoading(false);
        return;
      }

      // Update document record
      const updateResult = await updateDocumentFile(documentId, uploadResult.url);
      
      if (updateResult.success) {
        toast.success("Belge başarıyla yüklendi!");
        if (onUploadComplete) {
          onUploadComplete();
        } else {
          window.location.reload();
        }
      } else {
        toast.error(updateResult.error || "Belge güncellenemedi");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Dosya yüklenirken bir hata oluştu");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewFile = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (fileUrl) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewFile}
        className="flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        Görüntüle
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        className="hidden"
        id={`file-upload-${documentId}`}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Yükleniyor...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Yükle
          </>
        )}
      </Button>
    </div>
  );
}
