import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCRMAdapter } from '@/lib/crm/factory';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    
    if (adapter.getLeadSources) {
      const sources = await adapter.getLeadSources(session.user.id);
      return NextResponse.json({ sources });
    } else {
      return NextResponse.json(
        { error: 'Lead sources not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch lead sources' },
      { status: 500 }
    );
  }
}