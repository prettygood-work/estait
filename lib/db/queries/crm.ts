import { db } from '@/lib/db';
import { crmConnections, type CRMConnection } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encryptTokens, decryptTokens, type TokenData } from '@/lib/encryption/token-manager';

export async function storeCRMTokens(
  userId: string,
  crmType: string,
  tokens: TokenData
): Promise<CRMConnection> {
  const encryptedTokens = encryptTokens(tokens);
  
  const [connection] = await db
    .insert(crmConnections)
    .values({
      userId,
      crmType,
      accessToken: encryptedTokens.access_token,
      refreshToken: encryptedTokens.refresh_token,
      expiresAt: new Date(encryptedTokens.expires_at),
      scopes: encryptedTokens.scopes,
    })
    .onConflictDoUpdate({
      target: [crmConnections.userId, crmConnections.crmType],
      set: {
        accessToken: encryptedTokens.access_token,
        refreshToken: encryptedTokens.refresh_token,
        expiresAt: new Date(encryptedTokens.expires_at),
        scopes: encryptedTokens.scopes,
        updatedAt: new Date(),
      },
    })
    .returning();
  
  return connection;
}

export async function getCRMConnection(
  userId: string,
  crmType: string
): Promise<CRMConnection | null> {
  const [connection] = await db
    .select()
    .from(crmConnections)
    .where(and(eq(crmConnections.userId, userId), eq(crmConnections.crmType, crmType)))
    .limit(1);
  
  return connection || null;
}

export async function getCRMTokens(
  userId: string,
  crmType: string
): Promise<TokenData | null> {
  const connection = await getCRMConnection(userId, crmType);
  
  if (!connection) {
    return null;
  }
  
  return decryptTokens({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken,
    expires_at: connection.expiresAt.toISOString(),
    scopes: connection.scopes || undefined,
  });
}

export async function updateCRMTokens(
  userId: string,
  crmType: string,
  tokens: TokenData
): Promise<CRMConnection | null> {
  const encryptedTokens = encryptTokens(tokens);
  
  const [updated] = await db
    .update(crmConnections)
    .set({
      accessToken: encryptedTokens.access_token,
      refreshToken: encryptedTokens.refresh_token,
      expiresAt: new Date(encryptedTokens.expires_at),
      scopes: encryptedTokens.scopes,
      updatedAt: new Date(),
    })
    .where(and(eq(crmConnections.userId, userId), eq(crmConnections.crmType, crmType)))
    .returning();
  
  return updated || null;
}

export async function deleteCRMConnection(
  userId: string,
  crmType: string
): Promise<boolean> {
  const result = await db
    .delete(crmConnections)
    .where(and(eq(crmConnections.userId, userId), eq(crmConnections.crmType, crmType)));
  
  return true;
}

export async function isCRMConnected(
  userId: string,
  crmType: string
): Promise<boolean> {
  const connection = await getCRMConnection(userId, crmType);
  return !!connection;
}