import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const disconnectSchema = z.object({
  crmType: z.enum(['wise_agent']),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = disconnectSchema.parse(body);
    
    const adapter = getCRMAdapter(validated.crmType);
    const success = await adapter.disconnect(session.user.id);
    
    return NextResponse.json({ success });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error disconnecting CRM:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to disconnect CRM' },
      { status: 500 }
    );
  }
}