"use server";

import { prisma } from "@/lib/prisma";

export async function updateDocumentFile(documentId: string, fileUrl: string) {
  try {
    // Update document with file URL and status
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        filePath: fileUrl,
        isUploaded: true,
        uploadDate: new Date(),
        status: 'UPLOADED'
      }
    });

    return { success: true, document: updatedDocument };
  } catch (error) {
    console.error("Document update error:", error);
    return { success: false, error: "Belge güncellenirken bir hata oluştu" };
  }
}
