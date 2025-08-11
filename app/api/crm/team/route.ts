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
    const team = await adapter.getTeam(session.user.id);
    
    return NextResponse.json({ team });
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch team' },
      { status: 500 }
    );
  }
}