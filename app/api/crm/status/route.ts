import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter, getSupportedCRMs } from '@/lib/crm/factory';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supportedCRMs = getSupportedCRMs();
    const connectionStatus = await Promise.all(
      supportedCRMs.map(async (crm) => {
        try {
          const adapter = getCRMAdapter(crm.type);
          const connected = await adapter.isConnected(session.user.id);
          return { type: crm.type, name: crm.name, connected };
        } catch (err: any) {
          // Gracefully handle missing table or adapter errors
          if (err?.code === '42P01') {
            return { type: crm.type, name: crm.name, connected: false };
          }
          return { type: crm.type, name: crm.name, connected: false };
        }
      }),
    );

    return NextResponse.json({ crms: connectionStatus });
  } catch (error) {
    console.error('Error checking CRM status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check CRM status',
      },
      { status: 500 },
    );
  }
}