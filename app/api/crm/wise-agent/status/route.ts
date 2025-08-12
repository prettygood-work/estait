import { auth } from '@/app/(auth)/auth';
import { getWiseAgentConnectionStatus } from '@/lib/crm/wise-agent-auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ connected: false }, { status: 200 });
  }
  const status = await getWiseAgentConnectionStatus(session.user.id);
  return Response.json(status);
}
