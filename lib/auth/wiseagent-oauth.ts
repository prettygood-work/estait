import { getCRMTokens, updateCRMTokens } from '@/lib/db/queries/crm';
import type { TokenData } from '@/lib/encryption/token-manager';

const CLIENT_ID = process.env.WISE_AGENT_CLIENT_ID || '29afa25e-cce6-47ac-8375-2da7c361031a';
const CLIENT_SECRET = process.env.WISE_AGENT_CLIENT_SECRET || 't48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=';
const TOKEN_URL = 'https://sync.thewiseagent.com/WiseAuth/token';
const REVOKE_URL = 'https://sync.thewiseagent.com/WiseAuth/revoke';

export interface WiseAgentTokens extends TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes?: string[];
}

export async function refreshAccessToken(userId: string): Promise<WiseAgentTokens | null> {
  try {
    const tokens = await getCRMTokens(userId, 'wise_agent');
    if (!tokens) {
      throw new Error('No tokens found for user');
    }
    
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
    
    const newTokens = await response.json();
    
    const updatedTokens: WiseAgentTokens = {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token, // Some providers reuse refresh tokens
      expires_at: newTokens.expires_at || new Date(Date.now() + 3600 * 1000).toISOString(),
      scopes: tokens.scopes
    };
    
    // Update tokens in database
    await updateCRMTokens(userId, 'wise_agent', updatedTokens);
    
    return updatedTokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return null;
  }
}

export async function getValidAccessToken(userId: string): Promise<string | null> {
  try {
    const tokens = await getCRMTokens(userId, 'wise_agent');
    if (!tokens) {
      return null;
    }
    
    // Check if token is expired
    const expiresAt = new Date(tokens.expires_at);
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    // If token expires in less than 5 minutes, refresh it
    if (expiresAt <= fiveMinutesFromNow) {
      const refreshedTokens = await refreshAccessToken(userId);
      if (!refreshedTokens) {
        return null;
      }
      return refreshedTokens.access_token;
    }
    
    return tokens.access_token;
  } catch (error) {
    console.error('Error getting valid access token:', error);
    return null;
  }
}

export async function revokeTokens(userId: string): Promise<boolean> {
  try {
    const tokens = await getCRMTokens(userId, 'wise_agent');
    if (!tokens) {
      return true; // Already disconnected
    }
    
    // Revoke access token
    const accessResponse = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: tokens.access_token,
        token_type_hint: 'access_token'
      })
    });
    
    if (!accessResponse.ok) {
      console.error('Failed to revoke access token');
    }
    
    // Revoke refresh token
    const refreshResponse = await fetch(REVOKE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token: tokens.refresh_token,
        token_type_hint: 'refresh_token'
      })
    });
    
    if (!refreshResponse.ok) {
      console.error('Failed to revoke refresh token');
    }
    
    return true;
  } catch (error) {
    console.error('Error revoking tokens:', error);
    return false;
  }
}