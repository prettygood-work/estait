import { NextRequest, NextResponse } from 'next/server';
import { generateState, storeState } from '@/lib/auth/oauth-state';
import { auth } from '@/app/(auth)/auth';

const WISE_AGENT_AUTH_URL = 'https://sync.thewiseagent.com/WiseAuth/auth';
const CLIENT_ID = process.env.WISE_AGENT_CLIENT_ID || '29afa25e-cce6-47ac-8375-2da7c361031a';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/wiseagent/callback`;
const SCOPES = 'profile contacts team marketing calendar properties';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Generate and store OAuth state
    const state = generateState();
    await storeState(state, request);
    
    // Build authorization URL
    const authUrl = new URL(WISE_AGENT_AUTH_URL);
    authUrl.searchParams.append('client_id', CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('state', state);
    
    // Store user ID in state for callback
    const stateData = {
      state,
      userId: session.user.id,
      timestamp: Date.now()
    };
    
    // Return the authorization URL
    return NextResponse.json({ 
      authUrl: authUrl.toString(),
      state: state
    });
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    );
  }
}