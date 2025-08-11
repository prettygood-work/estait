import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WiseAgentAdapter } from '@/lib/crm/adapters/wiseagent';
import type { ContactData } from '@/lib/crm/interfaces';

// Mock the auth and database modules
vi.mock('@/lib/auth/wiseagent-oauth', () => ({
  getValidAccessToken: vi.fn(() => Promise.resolve('mock-access-token')),
  refreshAccessToken: vi.fn(),
  revokeTokens: vi.fn(() => Promise.resolve(true)),
}));

vi.mock('@/lib/db/queries/crm', () => ({
  getCRMConnection: vi.fn(() => Promise.resolve({
    id: 'mock-id',
    userId: 'user-123',
    crmType: 'wise_agent',
    accessToken: 'encrypted-token',
    refreshToken: 'encrypted-refresh',
    expiresAt: new Date(Date.now() + 3600000),
  })),
  deleteCRMConnection: vi.fn(() => Promise.resolve(true)),
}));

// Mock fetch for API calls
global.fetch = vi.fn();

describe('WiseAgentAdapter - Contact Operations', () => {
  let adapter: WiseAgentAdapter;
  const mockUserId = 'user-123';
  
  beforeEach(() => {
    adapter = new WiseAgentAdapter();
    vi.clearAllMocks();
  });
  
  describe('createContact', () => {
    it('should create a contact successfully', async () => {
      const contactData: ContactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        source: 'Website',
        categories: ['Buyer', 'Hot Lead'],
      };
      
      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          success: 'true',
          data: {
            ClientID: 12345,
            NewContact: true,
          },
        }),
      });
      
      const result = await adapter.createContact(mockUserId, contactData);
      
      expect(result).toEqual({
        id: '12345',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-1234',
        source: 'Website',
        categories: ['Buyer', 'Hot Lead'],
      });
      
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('webconnect.asp'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-access-token',
          }),
        })
      );
    });
    
    it('should handle API errors gracefully', async () => {
      const contactData: ContactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        source: 'API',
      };
      
      // Mock API error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        text: async () => 'Invalid data',
      });
      
      await expect(adapter.createContact(mockUserId, contactData))
        .rejects.toThrow('API request failed');
    });
  });
  
  describe('searchContacts', () => {
    it('should search contacts by email', async () => {
      // Mock count response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ count: 1 }),
      });
      
      // Mock contacts response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{
          ClientID: 12345,
          CFirst: 'John',
          CLast: 'Doe',
          CEmail: 'john.doe@example.com',
          Categories: '[{"name":"Buyer"}]',
        }]),
      });
      
      const result = await adapter.searchContacts(mockUserId, {
        email: 'john.doe@example.com',
      });
      
      expect(result.total).toBe(1);
      expect(result.contacts).toHaveLength(1);
      expect(result.contacts[0]).toEqual({
        id: '12345',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        categories: ['Buyer'],
        address: {},
      });
    });
    
    it('should handle pagination', async () => {
      // Mock count response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ count: 150 }),
      });
      
      // Mock contacts response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify(Array(50).fill({
          ClientID: 12345,
          CFirst: 'Test',
          CLast: 'User',
        })),
      });
      
      const result = await adapter.searchContacts(mockUserId, {
        page: 2,
        pageSize: 50,
      });
      
      expect(result.total).toBe(150);
      expect(result.contacts).toHaveLength(50);
      
      // Verify pagination parameters
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
  
  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const updateData = {
        email: 'newemail@example.com',
        status: 'Active',
        rank: 'A' as const,
      };
      
      // Mock update response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify({ Success: '12345 updated' }),
      });
      
      // Mock get contact response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        text: async () => JSON.stringify([{
          ClientID: 12345,
          CFirst: 'John',
          CLast: 'Doe',
          CEmail: 'newemail@example.com',
          Status: 'Active',
          Rank: 'A',
        }]),
      });
      
      const result = await adapter.updateContact(mockUserId, '12345', updateData);
      
      expect(result.email).toBe('newemail@example.com');
      expect(result.status).toBe('Active');
      expect(result.rank).toBe('A');
    });
  });
});