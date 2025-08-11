import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const addContactsToProgramSchema = z.object({
  crmType: z.enum(['wise_agent']),
  contactIds: z.array(z.string()).min(1),
  programId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    
    if (adapter.getMarketingPrograms) {
      const programs = await adapter.getMarketingPrograms(session.user.id);
      return NextResponse.json({ programs });
    } else {
      return NextResponse.json(
        { error: 'Marketing programs not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Error fetching marketing programs:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch marketing programs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = addContactsToProgramSchema.parse(body);
    
    const adapter = getCRMAdapter(validated.crmType);
    
    if (adapter.addContactsToProgram) {
      const success = await adapter.addContactsToProgram(
        session.user.id,
        validated.contactIds,
        validated.programId
      );
      return NextResponse.json({ success });
    } else {
      return NextResponse.json(
        { error: 'Adding contacts to programs not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error adding contacts to program:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add contacts to program' },
      { status: 500 }
    );
  }
}