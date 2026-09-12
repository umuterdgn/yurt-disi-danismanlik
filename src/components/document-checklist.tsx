"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertCircle, Upload, FileText } from "lucide-react";
import { FileUploadButton } from "@/components/file-upload-button";

interface Document {
  id: string;
  documentType: string;
  documentName: string;
  status: string;
  feedback?: string;
  aiCheckStatus?: boolean;
  filePath?: string;
}

interface DocumentChecklistProps {
  documents: Document[];
  applicationId: string;
  universityRequirements?: string[] | null;
}

export function DocumentChecklist({ documents, applicationId, universityRequirements }: DocumentChecklistProps) {
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);

  // Default requirements if not provided
  const defaultRequirements = [
    'Pasaport',
    'Transkript',
    'Diploma',
    'IELTS/TOEFL Sertifikası',
    'Niyet Mektubu (Statement of Purpose)',
    'Özgeçmiş (CV/Resume)',
    'Referans Mektupları',
    'Finansal Belgeler'
  ];

  const requirements = universityRequirements || defaultRequirements;

  const getDocumentStatus = (requirement: string) => {
    const doc = documents.find(d => 
      d.documentType.toLowerCase().includes(requirement.toLowerCase()) ||
      requirement.toLowerCase().includes(d.documentType.toLowerCase())
    );

    if (!doc) return { status: 'MISSING', document: null };
    return { status: doc.status, document: doc };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'UPLOADED':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'REVISION_REQUIRED':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'REJECTED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-700">Onaylandı</Badge>;
      case 'UPLOADED':
        return <Badge className="bg-blue-100 text-blue-700">Yüklendi</Badge>;
      case 'REVISION_REQUIRED':
        return <Badge className="bg-orange-100 text-orange-700">Revizyon Gerekiyor</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700">Reddedildi</Badge>;
      case 'MISSING':
        return <Badge className="bg-gray-100 text-gray-700">Eksik</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-50 border-green-200';
      case 'UPLOADED':
        return 'bg-blue-50 border-blue-200';
      case 'REVISION_REQUIRED':
        return 'bg-orange-50 border-orange-200';
      case 'REJECTED':
        return 'bg-red-50 border-red-200';
      case 'MISSING':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const calculateCompletionRate = () => {
    const completed = documents.filter(d => d.status === 'APPROVED').length;
    return Math.round((completed / requirements.length) * 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Evrak Checklist
          </div>
          <Badge variant="outline">
            %{calculateCompletionRate()} Tamamlandı
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {requirements.map((requirement) => {
            const { status, document } = getDocumentStatus(requirement);
            
            return (
              <div 
                key={requirement}
                className={`border rounded-lg p-4 ${getStatusColor(status)} transition-all`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(status)}
                    <div>
                      <h4 className="font-medium text-gray-900">{requirement}</h4>
                      {document && (
                        <p className="text-xs text-gray-600">{document.documentName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    {document?.aiCheckStatus && (
                      <Badge className="bg-purple-100 text-purple-700 text-xs">
                        AI ✓
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Upload button for missing documents */}
                {status === 'MISSING' && (
                  <div className="mt-3">
                    <FileUploadButton 
                      applicationId={applicationId}
                      documentType={requirement}
                      documentName={requirement}
                    />
                  </div>
                )}

                {/* Expandable details for uploaded documents */}
                {document && (
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedDoc(expandedDoc === document.id ? null : document.id)}
                      className="text-xs"
                    >
                      {expandedDoc === document.id ? 'Detayları Gizle' : 'Detayları Göster'}
                    </Button>

                    {expandedDoc === document.id && (
                      <div className="mt-3 p-3 bg-white rounded-lg border">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Belge Adı:</span>
                            <span className="font-medium">{document.documentName}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Durum:</span>
                            {getStatusBadge(document.status)}
                          </div>
                          {document.feedback && (
                            <div className="p-2 bg-red-50 rounded border border-red-200">
                              <p className="text-xs font-medium text-red-900 mb-1">Geri Bildirim:</p>
                              <p className="text-xs text-red-700">{document.feedback}</p>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">AI Kontrol:</span>
                            <span className="text-xs">
                              {document.aiCheckStatus ? (
                                <span className="text-green-600">✓ Tamamlandı</span>
                              ) : (
                                <span className="text-gray-500">Bekliyor</span>
                              )}
                            </span>
                          </div>
                          <div className="mt-2">
                            <FileUploadButton 
                              documentId={document.id}
                              filePath={document.filePath}
                              documentName={document.documentName}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Onaylanan</p>
              <p className="text-xl font-bold text-green-600">
                {documents.filter(d => d.status === 'APPROVED').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bekleyen</p>
              <p className="text-xl font-bold text-yellow-600">
                {documents.filter(d => d.status === 'UPLOADED').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Eksik</p>
              <p className="text-xl font-bold text-red-600">
                {requirements.length - documents.length}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}