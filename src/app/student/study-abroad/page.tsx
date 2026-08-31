"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CloudUpload, FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const studentProfile = {
  name: "Ahmet Yılmaz",
  targetCountry: "Polonya",
  targetUniversity: "Varsovia University",
  targetProgram: "Bilgisayar Mühendisliği",
  languageLevel: "IELTS 6.5",
  budget: "2500 EUR/yıl",
  applicationStatus: "Evrak Toplama"
};

const documents = [
  { id: 1, name: "Pasaport", type: "Kimlik", status: "uploaded", uploadDate: "15.08.2026", expiryDate: "15.08.2036" },
  { id: 2, name: "Diploma", type: "Akademik", status: "uploaded", uploadDate: "20.08.2026", expiryDate: "-" },
  { id: 3, name: "Transkript", type: "Akademik", status: "uploaded", uploadDate: "20.08.2026", expiryDate: "-" },
  { id: 4, name: "CV (Özgeçmiş)", type: "Kişisel", status: "uploaded", uploadDate: "22.08.2026", expiryDate: "-" },
  { id: 5, name: "Motivasyon Mektubu", type: "Kişisel", status: "missing", uploadDate: "-", expiryDate: "-" },
  { id: 6, name: "IELTS Sertifikası", type: "Dil", status: "uploaded", uploadDate: "10.08.2026", expiryDate: "10.08.2028" },
  { id: 7, name: "Referans Mektubu", type: "Akademik", status: "missing", uploadDate: "-", expiryDate: "-" },
  { id: 8, name: "Fotoğraf (Biometrik)", type: "Kimlik", status: "uploaded", uploadDate: "18.08.2026", expiryDate: "-" },
  { id: 9, name: "Sağlık Raporu", type: "Sağlık", status: "missing", uploadDate: "-", expiryDate: "-" },
  { id: 10, name: "Maaş Beyanı", type: "Mali", status: "missing", uploadDate: "-", expiryDate: "-" }
];

const getDocumentStatusBadge = (status: string) => {
  if (status === "uploaded") {
    return <Badge className="bg-green-500 hover:bg-green-600">Yüklendi</Badge>;
  }
  return <Badge variant="destructive">Eksik</Badge>;
};

const getDocumentTypeBadge = (type: string) => {
  const typeColors: Record<string, string> = {
    "Kimlik": "bg-purple-100 text-purple-800 hover:bg-purple-200",
    "Akademik": "bg-blue-100 text-blue-800 hover:bg-blue-200",
    "Kişisel": "bg-green-100 text-green-800 hover:bg-green-200",
    "Dil": "bg-orange-100 text-orange-800 hover:bg-orange-200",
    "Sağlık": "bg-red-100 text-red-800 hover:bg-red-200",
    "Mali": "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
  };
  return <Badge className={typeColors[type] || "bg-gray-100 text-gray-800"}>{type}</Badge>;
};

export default function StudentStudyAbroadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      setUploadedFiles(prev => [...prev, file.name]);
      toast.success(`${file.name} başarıyla yüklendi`, {
        description: "Dosya sisteme kaydedildi",
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      setUploadedFiles(prev => [...prev, file.name]);
      toast.success(`${file.name} başarıyla yüklendi`, {
        description: "Dosya sisteme kaydedildi",
        icon: <CheckCircle className="w-5 h-5 text-green-500" />
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Yurt Dışı Başvuru Süreci</h1>
        
        {/* Student Profile Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Yurt Dışı Profil Özeti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-blue-100 mb-1">Öğrenci</p>
                <p className="text-xl font-semibold">{studentProfile.name}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Hedef Ülke</p>
                <p className="text-xl font-semibold">🇵🇱 {studentProfile.targetCountry}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Hedef Üniversite</p>
                <p className="text-xl font-semibold">{studentProfile.targetUniversity}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Program</p>
                <p className="text-lg font-semibold">{studentProfile.targetProgram}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Dil Seviyesi</p>
                <p className="text-lg font-semibold">{studentProfile.languageLevel}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100 mb-1">Bütçe</p>
                <p className="text-lg font-semibold">{studentProfile.budget}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-blue-400">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100 mb-1">Başvuru Durumu</p>
                  <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    {studentProfile.applicationStatus}
                  </Badge>
                </div>
                <Button className="bg-white text-blue-600 hover:bg-blue-50">
                  Profili Düzenle
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold text-gray-900">Evraklarım</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-600">Yüklendi: {documents.filter(d => d.status === "uploaded").length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-sm text-gray-600">Eksik: {documents.filter(d => d.status === "missing").length}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Drag and Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                multiple
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <CloudUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Dosyaları buraya sürükleyin
                </p>
                <p className="text-sm text-gray-500">
                  veya seçmek için tıklayın
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
              </label>
            </div>

            {/* Recently Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-900 mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Son Yüklenen Dosyalar
                </h4>
                <div className="space-y-2">
                  {uploadedFiles.map((fileName, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm text-green-800">
                      <FileText className="w-4 h-4" />
                      <span>{fileName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-600">Evrak Adı</TableHead>
                    <TableHead className="text-gray-600">Tür</TableHead>
                    <TableHead className="text-gray-600">Durum</TableHead>
                    <TableHead className="text-gray-600">Yükleme Tarihi</TableHead>
                    <TableHead className="text-gray-600">Son Kullanma</TableHead>
                    <TableHead className="text-gray-600">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium text-gray-900">{doc.name}</TableCell>
                      <TableCell>{getDocumentTypeBadge(doc.type)}</TableCell>
                      <TableCell>{getDocumentStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-gray-600">{doc.uploadDate}</TableCell>
                      <TableCell className="text-gray-600">{doc.expiryDate}</TableCell>
                      <TableCell>
                        {doc.status === "uploaded" ? (
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              Görüntüle
                            </Button>
                            <Button variant="outline" size="sm">
                              Yeniden Yükle
                            </Button>
                          </div>
                        ) : (
                          <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                            Dosya Yükle
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Document Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">Tamamlanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-700">
                    {documents.filter(d => d.status === "uploaded").length}/10
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-red-700">Eksik Evrak</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-red-700">
                    {documents.filter(d => d.status === "missing").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">Akademik</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-700">
                    {documents.filter(d => d.type === "Akademik").length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50 border-purple-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Kimlik</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-700">
                    {documents.filter(d => d.type === "Kimlik").length}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Urgent Documents Alert */}
            {documents.filter(d => d.status === "missing").length > 0 && (
              <Card className="mt-6 bg-red-50 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-red-100 rounded-full">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-red-900 mb-1">Acil Eksik Evraklar</h3>
                      <p className="text-sm text-red-800 mb-2">
                        Başvurunuzun tamamlanması için aşağıdaki evrakları en kısa sürede yüklemeniz gerekmektedir:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {documents.filter(d => d.status === "missing").map((doc) => (
                          <Badge key={doc.id} variant="outline" className="border-red-300 text-red-700">
                            {doc.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
