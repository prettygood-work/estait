import { NextRequest, NextResponse } from 'next/server';
import { validateState, clearState } from '@/lib/auth/oauth-state';
import { storeCRMTokens } from '@/lib/db/queries/crm';
import { auth } from '@/app/(auth)/auth';

const CLIENT_ID = process.env.WISE_AGENT_CLIENT_ID || '29afa25e-cce6-47ac-8375-2da7c361031a';
const CLIENT_SECRET = process.env.WISE_AGENT_CLIENT_SECRET || 't48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/auth/wiseagent/callback`;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, errorDescription);
      await clearState();
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      );
    }
    
    // Validate state parameter
    if (!await validateState(state, request)) {
      return NextResponse.redirect(
        new URL('/settings?error=Invalid state parameter', request.url)
      );
    }
    
    // Check if code is present
    if (!code) {
      return NextResponse.redirect(
        new URL('/settings?error=No authorization code received', request.url)
      );
    }
    
    // Get the current user session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/settings?error=Unauthorized', request.url)
      );
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://sync.thewiseagent.com/WiseAuth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        new URL('/settings?error=Failed to exchange code for tokens', request.url)
      );
    }
    
    const tokens = await tokenResponse.json();
    
    // Extract scopes from the response
    const scopes = searchParams.get('scope')?.split(' ') || ['profile', 'contacts', 'team', 'marketing', 'calendar', 'properties'];
    
    // Store encrypted tokens in database
    await storeCRMTokens(session.user.id, 'wise_agent', {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at || new Date(Date.now() + 3600 * 1000).toISOString(), // Default 1 hour if not provided
      scopes
    });
    
    // Redirect to settings page with success message
    return NextResponse.redirect(
      new URL('/settings?connected=true&crm=wise_agent', request.url)
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/settings?error=An unexpected error occurred', request.url)
    );
  }
}