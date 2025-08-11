import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const STATE_COOKIE_NAME = 'oauth_state';
const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function generateState(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function storeState(state: string, request: NextRequest): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_NAME, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_EXPIRY_MS / 1000,
    path: '/'
  });
}

export async function validateState(state: string | null, request: NextRequest): Promise<boolean> {
  if (!state) return false;
  
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  
  if (!storedState || storedState !== state) {
    return false;
  }
  
  // Clear the state cookie after validation
  cookieStore.delete(STATE_COOKIE_NAME);
  return true;
}

export async function clearState(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(STATE_COOKIE_NAME);
}