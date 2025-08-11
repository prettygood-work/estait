import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '@/app/(chat)/api/chat/route';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter } from '@/lib/crm/factory';

// Mock dependencies
vi.mock('@/app/(auth)/auth');
vi.mock('@/lib/crm/factory');
vi.mock('@/lib/db/queries', () => ({
  getChatById: vi.fn(() => Promise.resolve({ id: 'test-chat', userId: 'test-user' })),
  getMessagesByChatId: vi.fn(() => Promise.resolve([])),
  saveChat: vi.fn(),
  saveMessages: vi.fn(),
  getMessageCountByUserId: vi.fn(() => Promise.resolve(0)),
  createStreamId: vi.fn(),
}));

describe('Wise Agent Chat Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock authenticated user
    (auth as any).mockResolvedValue({
      user: { id: 'test-user', type: 'regular' }
    });
  });

  it('should check Wise Agent connection for CRM queries', async () => {
    const mockAdapter = {
      isConnected: vi.fn(() => Promise.resolve(false)),
    };
    (getCRMAdapter as any).mockReturnValue(mockAdapter);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-chat',
        message: {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Create a new lead John Smith' }],
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      }),
    });

    const response = await POST(request);
    
    // Should check Wise Agent connection
    expect(mockAdapter.isConnected).toHaveBeenCalledWith('test-user');
  });

  it('should use OpenAI provider when configured', () => {
    // Set OpenAI API key
    process.env.OPENAI_API_KEY = 'test-key';
    
    // Import provider after setting env var
    vi.resetModules();
    const { myProvider } = require('@/lib/ai/providers');
    
    // Should have OpenAI models configured
    expect(() => myProvider.languageModel('chat-model')).not.toThrow();
  });

  it('should include Wise Agent tools when connected', async () => {
    const mockAdapter = {
      isConnected: vi.fn(() => Promise.resolve(true)),
    };
    (getCRMAdapter as any).mockReturnValue(mockAdapter);

    const request = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 'test-chat',
        message: {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Show my contacts' }],
        },
        selectedChatModel: 'chat-model',
        selectedVisibilityType: 'private',
      }),
    });

    const response = await POST(request);
    
    // Should be successful when connected
    expect(response.status).not.toBe(400);
  });
});

describe('Wise Agent Connection Status', () => {
  it('should return connection status', async () => {
    const { GET } = require('@/app/api/crm/status/route');
    
    (auth as any).mockResolvedValue({
      user: { id: 'test-user' }
    });

    const mockAdapter = {
      isConnected: vi.fn(() => Promise.resolve(true)),
    };
    
    vi.mocked(getCRMAdapter).mockReturnValue(mockAdapter);

    const request = new Request('http://localhost:3000/api/crm/status');
    const response = await GET(request);
    const data = await response.json();

    expect(data.crms).toBeDefined();
    expect(data.crms).toContainEqual({
      type: 'wise_agent',
      name: 'Wise Agent',
      connected: true,
    });
  });
});