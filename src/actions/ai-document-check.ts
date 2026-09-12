'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createServerClient } from '@supabase/ssr';

export async function checkDocumentWithAI(documentId: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.email) {
      return { success: false, error: 'Unauthorized' };
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email }
    });

    if (!dbUser) {
      return { success: false, error: 'User not found' };
    }

    // Get document with application info
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        application: {
          include: {
            studentProfile: {
              include: { user: true }
            }
          }
        }
      }
    });

    if (!document) {
      return { success: false, error: 'Document not found' };
    }

    // AI Document Check (Mock implementation for now)
    // In production, this would call Groq AI or similar service
    const aiCheckResult = await performAIDocumentCheck(document);

    // Update document with AI check results
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        aiCheckStatus: true,
        aiCheckDate: new Date(),
        status: aiCheckResult.needsRevision ? 'REVISION_REQUIRED' : document.status,
        feedback: aiCheckResult.feedback || document.feedback
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: dbUser.id,
        action: 'AI_DOCUMENT_CHECKED',
        entityType: 'Document',
        entityId: documentId,
        details: `AI document check completed. Status: ${aiCheckResult.status}, Feedback: ${aiCheckResult.feedback}`
      }
    });

    // Create notification if revision is required
    if (aiCheckResult.needsRevision && document.application?.studentProfile?.userId) {
      await prisma.notification.create({
        data: {
          userId: document.application.studentProfile.userId,
          title: 'AI Evrak Kontrolü - Revizyon Gerekiyor',
          message: `${document.documentType} evrağınız AI tarafından kontrol edildi. ${aiCheckResult.feedback}`,
          type: 'MISSING_DOCUMENT',
          relatedEntityType: 'Document',
          relatedEntityId: documentId
        }
      });
    }

    // Revalidate paths
    revalidatePath('/advisor/documents');
    revalidatePath('/student/dashboard');
    revalidatePath('/student/study-abroad');

    return {
      success: true,
      document: updatedDocument,
      aiCheckResult
    };

  } catch (error) {
    console.error('AI document check error:', error);
    return { success: false, error: 'AI evrak kontrolü sırasında bir hata oluştu' };
  }
}

// Mock AI Document Check Function
// In production, this would integrate with Groq AI or similar service
async function performAIDocumentCheck(document: any) {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock AI analysis logic
  // In production, this would analyze the actual document content
  const mockIssues = [
    {
      type: 'READABILITY',
      message: 'Belge okunabilirliği düşük. Lütfen daha yüksek çözünürlüklü bir sürüm yükleyin.',
      severity: 'medium'
    },
    {
      type: 'EXPIRY',
      message: 'Belge süresi yakın zamanda dolabilir. Lütfen geçerlilik tarihini kontrol edin.',
      severity: 'high'
    },
    {
      type: 'COMPLETENESS',
      message: 'Belge eksik bilgi içeriyor. Lütfen tüm gerekli alanların doldurulduğundan emin olun.',
      severity: 'low'
    },
    {
      type: 'FORMAT',
      message: 'Belge formatı uygun. PDF formatında yüklenmiş.',
      severity: 'none'
    }
  ];

  // Randomly select an issue for demonstration
  const randomIssue = mockIssues[Math.floor(Math.random() * mockIssues.length)];

  // If the issue severity is 'none', document is approved
  if (randomIssue.severity === 'none') {
    return {
      status: 'APPROVED',
      needsRevision: false,
      feedback: 'AI Analizi: Belge formatı ve kalitesi uygun. Onaylandı.',
      confidence: 0.95
    };
  }

  // Otherwise, request revision
  return {
    status: 'REVISION_REQUIRED',
    needsRevision: true,
    feedback: `AI Analizi: ${randomIssue.message}`,
    confidence: 0.85,
    issueType: randomIssue.type,
    severity: randomIssue.severity
  };
}