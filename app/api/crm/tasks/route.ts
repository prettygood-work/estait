import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const createTaskSchema = z.object({
  crmType: z.enum(['wise_agent']),
  task: z.object({
    description: z.string().min(1),
    dueDate: z.string().datetime().optional(),
    priority: z.enum(['None', 'Low', 'Medium', 'High']).optional(),
    contactId: z.string().optional(),
    assignedTo: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = createTaskSchema.parse(body);
    
    const adapter = getCRMAdapter(validated.crmType);
    const task = await adapter.createTask(session.user.id, {
      ...validated.task,
      dueDate: validated.task.dueDate ? new Date(validated.task.dueDate) : undefined,
    });
    
    return NextResponse.json({ success: true, task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    const contactId = searchParams.get('contactId') || undefined;
    
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    
    if (adapter.getTasks) {
      const tasks = await adapter.getTasks(session.user.id, contactId);
      return NextResponse.json({ tasks });
    } else {
      return NextResponse.json(
        { error: 'Get tasks operation not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}