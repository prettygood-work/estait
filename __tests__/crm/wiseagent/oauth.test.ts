import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateState, validateState } from '@/lib/auth/oauth-state';
import { encrypt, decrypt } from '@/lib/encryption/token-manager';

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('OAuth State Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should generate a valid state parameter', () => {
    const state = generateState();
    expect(state).toBeTruthy();
    expect(state.length).toBe(64); // 32 bytes in hex = 64 characters
  });
  
  it('should generate unique state parameters', () => {
    const state1 = generateState();
    const state2 = generateState();
    expect(state1).not.toBe(state2);
  });
});

describe('Token Encryption', () => {
  const testToken = 'test-access-token-12345';
  
  beforeEach(() => {
    // Set encryption key for tests
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';
  });
  
  it('should encrypt and decrypt tokens correctly', () => {
    const encrypted = encrypt(testToken);
    expect(encrypted).not.toBe(testToken);
    expect(encrypted.length).toBeGreaterThan(0);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(testToken);
  });
  
  it('should produce different encrypted values for the same input', () => {
    const encrypted1 = encrypt(testToken);
    const encrypted2 = encrypt(testToken);
    expect(encrypted1).not.toBe(encrypted2); // Due to random IV
    
    // But both should decrypt to the same value
    expect(decrypt(encrypted1)).toBe(testToken);
    expect(decrypt(encrypted2)).toBe(testToken);
  });
  
  it('should handle token data encryption', () => {
    const tokenData = {
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-456',
      expires_at: '2024-12-31T23:59:59Z',
      scopes: ['contacts', 'team'],
    };
    
    const encrypted = encrypt(JSON.stringify(tokenData));
    const decrypted = JSON.parse(decrypt(encrypted));
    
    expect(decrypted).toEqual(tokenData);
  });
});