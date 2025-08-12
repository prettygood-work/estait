import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter } from '@/lib/crm/factory';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    const targetPage = searchParams.get('targetPage') || undefined;
    
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    
    if (adapter.generateSSOLink) {
      const ssoUrl = await adapter.generateSSOLink(session.user.id, targetPage);
      return NextResponse.json({ ssoUrl });
    } else {
      return NextResponse.json(
        { error: 'SSO not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Error generating SSO link:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate SSO link' },
      { status: 500 }
    );
  }
}