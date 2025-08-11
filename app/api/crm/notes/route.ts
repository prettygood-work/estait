import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const createNoteSchema = z.object({
  crmType: z.enum(['wise_agent']),
  contactId: z.string().min(1),
  note: z.string().min(1),
  subject: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

const getNotesSchema = z.object({
  crmType: z.enum(['wise_agent']),
  contactId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = createNoteSchema.parse(body);
    
    const adapter = getCRMAdapter(validated.crmType);
    const note = await adapter.createNote(
      session.user.id,
      validated.contactId,
      validated.note,
      validated.subject,
      validated.categories
    );
    
    return NextResponse.json({ success: true, note });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create note' },
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
    const params = {
      crmType: searchParams.get('crmType') || 'wise_agent',
      contactId: searchParams.get('contactId') || '',
    };
    
    const validated = getNotesSchema.parse(params);
    
    const adapter = getCRMAdapter(validated.crmType);
    const notes = await adapter.getNotes(session.user.id, validated.contactId);
    
    return NextResponse.json({ notes });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}