import { auth } from '@/app/(auth)/auth';
import { revokeTokens } from '@/lib/auth/wiseagent-oauth';
import { deleteCRMConnection } from '@/lib/db/queries/crm';

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    await revokeTokens(session.user.id);
    await deleteCRMConnection(session.user.id, 'wise_agent');
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ success: false }, { status: 500 });
  }
}
