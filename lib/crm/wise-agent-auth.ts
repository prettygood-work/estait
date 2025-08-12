import { db } from '@/lib/db';
import { crmConnections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/encryption/token-manager';

export async function checkWiseAgentConnection(
  userId: string,
): Promise<boolean> {
  try {
    const [connection] = await db
      .select()
      .from(crmConnections)
      .where(
        and(
          eq(crmConnections.userId, userId),
          eq(crmConnections.crmType, 'wise_agent'),
        ),
      )
      .limit(1);

    if (!connection) {
      return false;
    }

    // Check if token is not expired
    const now = new Date();
    return connection.expiresAt > now;
  } catch (error: any) {
    if (error?.code === '42P01') {
      // Table not migrated yet
      return false;
    }
    console.error('Error checking Wise Agent connection:', error);
    return false;
  }
}

export async function getWiseAgentToken(
  userId: string,
): Promise<string | null> {
  try {
    const [connection] = await db
      .select()
      .from(crmConnections)
      .where(
        and(
          eq(crmConnections.userId, userId),
          eq(crmConnections.crmType, 'wise_agent'),
        ),
      )
      .limit(1);

    if (!connection) {
      return null;
    }

    // Check if token is expired
    const now = new Date();
    if (connection.expiresAt <= now) {
      console.warn('Wise Agent token expired for user:', userId);
      return null;
    }

    // Decrypt and return the token
    return decrypt(connection.accessToken);
  } catch (error: any) {
    if (error?.code === '42P01') {
      return null;
    }
    console.error('Error getting Wise Agent token:', error);
    return null;
  }
}

export async function getWiseAgentConnectionStatus(userId: string): Promise<{
  connected: boolean;
  expiresAt?: Date;
  expired?: boolean;
}> {
  try {
    const [connection] = await db
      .select()
      .from(crmConnections)
      .where(
        and(
          eq(crmConnections.userId, userId),
          eq(crmConnections.crmType, 'wise_agent'),
        ),
      )
      .limit(1);

    if (!connection) {
      return { connected: false };
    }
    const now = new Date();
    return {
      connected: connection.expiresAt > now,
      expiresAt: connection.expiresAt,
      expired: connection.expiresAt <= now,
    };
  } catch (error: any) {
    if (error?.code === '42P01') {
      return { connected: false };
    }
    return { connected: false };
  }
}

export async function isWiseAgentConfigured(): Promise<boolean> {
  return !!(
    process.env.WISE_AGENT_CLIENT_ID && process.env.WISE_AGENT_CLIENT_SECRET
  );
}
