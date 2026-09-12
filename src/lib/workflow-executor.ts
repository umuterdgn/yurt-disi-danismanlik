import { prisma } from '@/lib/prisma';

interface WorkflowExecutionContext {
  trigger: string;
  entityType?: string;
  entityId?: string;
  additionalData?: Record<string, any>;
}

export async function executeWorkflows(context: WorkflowExecutionContext) {
  try {
    // Find active workflows for the given trigger
    const workflows = await prisma.workflow.findMany({
      where: {
        trigger: context.trigger as any,
        isActive: true
      },
      include: {
        actions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (workflows.length === 0) {
      console.log(`No active workflows found for trigger: ${context.trigger}`);
      return { executed: 0, results: [] };
    }

    const results = [];

    for (const workflow of workflows) {
      console.log(`Executing workflow: ${workflow.name}`);

      for (const action of workflow.actions) {
        try {
          const result = await executeAction(action, context);
          results.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            actionId: action.id,
            actionType: action.actionType,
            success: true,
            result
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              action: `WORKFLOW_ACTION_${action.actionType}`,
              entityType: context.entityType || 'Workflow',
              entityId: context.entityId,
              details: `Workflow "${workflow.name}" executed action "${action.actionType}"`
            }
          });

        } catch (error) {
          console.error(`Error executing action ${action.actionType}:`, error);
          results.push({
            workflowId: workflow.id,
            workflowName: workflow.name,
            actionId: action.id,
            actionType: action.actionType,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return {
      executed: workflows.length,
      results
    };

  } catch (error) {
    console.error('Error executing workflows:', error);
    throw error;
  }
}

async function executeAction(action: any, context: WorkflowExecutionContext) {
  const payload = action.payload ? JSON.parse(action.payload) : {};

  switch (action.actionType) {
    case 'CREATE_TASK':
      return await createTaskAction(payload, context);
    
    case 'SEND_WHATSAPP':
      return await sendWhatsAppAction(payload, context);
    
    case 'SEND_EMAIL':
      return await sendEmailAction(payload, context);
    
    case 'ASSIGN_ADVISOR':
      return await assignAdvisorAction(payload, context);
    
    case 'UPDATE_STATUS':
      return await updateStatusAction(payload, context);
    
    case 'CREATE_NOTIFICATION':
      return await createNotificationAction(payload, context);
    
    case 'TRIGGER_AI_ANALYSIS':
      return await triggerAIAnalysisAction(payload, context);
    
    default:
      throw new Error(`Unknown action type: ${action.actionType}`);
  }
}

async function createTaskAction(payload: any, context: WorkflowExecutionContext) {
  // Example: Create a task for a student
  if (!context.entityId) {
    throw new Error('Entity ID required for CREATE_TASK action');
  }

  const task = await prisma.task.create({
    data: {
      studentProfileId: context.entityId,
      title: payload.title || 'Otomatik Görev',
      description: payload.description,
      priority: payload.priority || 'medium',
      subject: payload.subject,
      status: 'TODO',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  return { taskId: task.id, message: 'Task created successfully' };
}

async function sendWhatsAppAction(payload: any, context: WorkflowExecutionContext) {
  // Mock WhatsApp sending (replace with actual API integration)
  console.log('📱 MOCK: Sending WhatsApp message');
  console.log('Payload:', payload);
  console.log('Context:', context);

  // Create audit log for WhatsApp sent
  await prisma.auditLog.create({
    data: {
      action: 'WHATSAPP_SENT',
      entityType: context.entityType || 'Workflow',
      entityId: context.entityId,
      details: `WhatsApp message sent (Mock): ${payload.message || 'No message content'}`
    }
  });

  return { message: 'WhatsApp message sent (mock)', success: true };
}

async function sendEmailAction(payload: any, context: WorkflowExecutionContext) {
  // Mock email sending (replace with actual email service)
  console.log('📧 MOCK: Sending email');
  console.log('Payload:', payload);
  console.log('Context:', context);

  return { message: 'Email sent (mock)', success: true };
}

async function assignAdvisorAction(payload: any, context: WorkflowExecutionContext) {
  if (!context.entityId || !payload.advisorId) {
    throw new Error('Entity ID and advisor ID required for ASSIGN_ADVISOR action');
  }

  const updatedStudent = await prisma.studentProfile.update({
    where: { id: context.entityId },
    data: { advisorId: payload.advisorId }
  });

  return { studentId: updatedStudent.id, advisorId: payload.advisorId, message: 'Advisor assigned successfully' };
}

async function updateStatusAction(payload: any, context: WorkflowExecutionContext) {
  if (!context.entityId || !payload.status) {
    throw new Error('Entity ID and status required for UPDATE_STATUS action');
  }

  // This is a generic status update - you'd need to implement specific logic based on entity type
  console.log('🔄 Updating status for entity:', context.entityId, 'to:', payload.status);

  return { entityId: context.entityId, status: payload.status, message: 'Status updated successfully' };
}

async function createNotificationAction(payload: any, context: WorkflowExecutionContext) {
  if (!context.entityId || !payload.userId) {
    throw new Error('Entity ID and user ID required for CREATE_NOTIFICATION action');
  }

  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      title: payload.title || 'Sistem Bildirimi',
      message: payload.message || 'Otomatik bildirim',
      type: payload.type || 'GENERAL',
      relatedEntityType: context.entityType,
      relatedEntityId: context.entityId
    }
  });

  return { notificationId: notification.id, message: 'Notification created successfully' };
}

async function triggerAIAnalysisAction(payload: any, context: WorkflowExecutionContext) {
  // Mock AI analysis trigger
  console.log('🤖 MOCK: Triggering AI analysis');
  console.log('Payload:', payload);
  console.log('Context:', context);

  return { message: 'AI analysis triggered (mock)', success: true };
}

// Example usage function that can be called from various parts of the application
export async function triggerWorkflowEvent(
  trigger: string,
  entityType?: string,
  entityId?: string,
  additionalData?: Record<string, any>
) {
  return executeWorkflows({
    trigger,
    entityType,
    entityId,
    additionalData
  });
}