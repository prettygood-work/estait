import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCRMConnection } from '@/lib/db/queries/crm';
import { getValidAccessToken } from '@/lib/auth/wiseagent-oauth';

export interface CRMAuthContext {
  userId: string;
  crmType: string;
  accessToken: string;
}

export async function withCRMAuth(
  request: NextRequest,
  handler: (request: NextRequest, context: CRMAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Check user authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get CRM type from request
    const crmType = request.headers.get('X-CRM-Type') || 
                   request.nextUrl.searchParams.get('crmType') || 
                   'wise_agent';
    
    // Check CRM connection
    const connection = await getCRMConnection(session.user.id, crmType);
    if (!connection) {
      return NextResponse.json(
        { error: 'CRM not connected', code: 'CRM_NOT_CONNECTED' },
        { status: 403 }
      );
    }
    
    // Get valid access token (handles refresh if needed)
    const accessToken = await getValidAccessToken(session.user.id);
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to get valid access token', code: 'TOKEN_INVALID' },
        { status: 403 }
      );
    }
    
    // Call the handler with auth context
    return handler(request, {
      userId: session.user.id,
      crmType,
      accessToken,
    });
  } catch (error) {
    console.error('CRM auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', code: 'AUTH_ERROR' },
      { status: 500 }
    );
  }
}

export function requireCRMConnection(crmType: string = 'wise_agent') {
  return async (request: NextRequest) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const connection = await getCRMConnection(session.user.id, crmType);
    if (!connection) {
      return NextResponse.json(
        { 
          error: 'CRM not connected', 
          code: 'CRM_NOT_CONNECTED',
          crmType 
        },
        { status: 403 }
      );
    }
    
    return null; // Continue to handler
  };
}