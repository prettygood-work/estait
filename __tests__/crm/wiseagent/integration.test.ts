import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getCRMAdapter } from '@/lib/crm/factory';
import type { CRMAdapter, ContactData } from '@/lib/crm/interfaces';

// Integration tests - only run with TEST_INTEGRATION=true
const runIntegrationTests = process.env.TEST_INTEGRATION === 'true';

describe.skipIf(!runIntegrationTests)('Wise Agent Integration Tests', () => {
  let adapter: CRMAdapter;
  const testUserId = process.env.TEST_USER_ID || 'test-user';
  let createdContactId: string | null = null;
  
  beforeAll(() => {
    adapter = getCRMAdapter('wise_agent');
  });
  
  afterAll(async () => {
    // Clean up test data
    if (createdContactId && adapter.deleteContact) {
      try {
        await adapter.deleteContact(testUserId, createdContactId);
      } catch (error) {
        console.error('Failed to clean up test contact:', error);
      }
    }
  });
  
  it('should check connection status', async () => {
    const connected = await adapter.isConnected(testUserId);
    expect(typeof connected).toBe('boolean');
  });
  
  it('should complete full contact lifecycle', async () => {
    // Skip if not connected
    const connected = await adapter.isConnected(testUserId);
    if (!connected) {
      console.log('Skipping integration test - Wise Agent not connected');
      return;
    }
    
    // 1. Create a contact
    const contactData: ContactData = {
      firstName: 'Integration',
      lastName: `Test ${Date.now()}`,
      email: `integration.test.${Date.now()}@example.com`,
      phone: '555-0000',
      source: 'Integration Test',
      categories: ['Test Contact'],
      notes: 'Created by integration test',
    };
    
    const createdContact = await adapter.createContact(testUserId, contactData);
    expect(createdContact).toBeTruthy();
    expect(createdContact.id).toBeTruthy();
    createdContactId = createdContact.id;
    
    // 2. Search for the contact
    const searchResult = await adapter.searchContacts(testUserId, {
      email: contactData.email,
    });
    expect(searchResult.total).toBeGreaterThan(0);
    expect(searchResult.contacts.some(c => c.id === createdContactId)).toBe(true);
    
    // 3. Get the specific contact
    const fetchedContact = await adapter.getContact(testUserId, createdContactId);
    expect(fetchedContact).toBeTruthy();
    expect(fetchedContact?.email).toBe(contactData.email);
    
    // 4. Update the contact
    const updatedContact = await adapter.updateContact(testUserId, createdContactId, {
      status: 'Active',
      rank: 'B',
    });
    expect(updatedContact.status).toBe('Active');
    expect(updatedContact.rank).toBe('B');
    
    // 5. Add a note
    const note = await adapter.createNote(
      testUserId,
      createdContactId,
      'Integration test note',
      'Test Note',
      ['Test']
    );
    expect(note).toBeTruthy();
    expect(note.id).toBeTruthy();
    
    // 6. Get notes
    const notes = await adapter.getNotes(testUserId, createdContactId);
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.some(n => n.id === note.id)).toBe(true);
    
    // 7. Create a task
    const task = await adapter.createTask(testUserId, {
      description: 'Integration test task',
      priority: 'Medium',
      contactId: createdContactId,
    });
    expect(task).toBeTruthy();
    expect(task.id).toBeTruthy();
  });
  
  it('should fetch team members', async () => {
    const connected = await adapter.isConnected(testUserId);
    if (!connected) {
      return;
    }
    
    const team = await adapter.getTeam(testUserId);
    expect(Array.isArray(team)).toBe(true);
  });
  
  it('should fetch marketing programs', async () => {
    const connected = await adapter.isConnected(testUserId);
    if (!connected || !adapter.getMarketingPrograms) {
      return;
    }
    
    const programs = await adapter.getMarketingPrograms(testUserId);
    expect(Array.isArray(programs)).toBe(true);
  });
  
  it('should generate SSO link', async () => {
    const connected = await adapter.isConnected(testUserId);
    if (!connected || !adapter.generateSSOLink) {
      return;
    }
    
    const ssoLink = await adapter.generateSSOLink(testUserId);
    expect(ssoLink).toBeTruthy();
    expect(ssoLink).toContain('thewiseagent.com');
  });
});