import { z } from 'zod';
import { tool } from 'ai';
import { getCRMAdapter } from '@/lib/crm/factory';
import type { CRMAdapter } from '@/lib/crm/interfaces';
import { auth } from '@/lib/auth';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }
  return session.user.id;
}

// Helper to get Wise Agent adapter
async function getWiseAgentAdapter(): Promise<CRMAdapter> {
  const userId = await getCurrentUserId();
  const adapter = getCRMAdapter('wise_agent');
  const isConnected = await adapter.isConnected(userId);
  if (!isConnected) {
    throw new Error('Wise Agent not connected. Please connect your account in settings.');
  }
  return adapter;
}

export const createLead = tool({
  description: 'Create a new lead/contact in Wise Agent CRM. Extract name, phone, email, and any other details from the user input.',
  inputSchema: z.object({
    firstName: z.string().describe('First name of the contact'),
    lastName: z.string().describe('Last name of the contact'),
    email: z.string().email().optional().describe('Email address if provided'),
    phone: z.string().optional().describe('Phone number - any format'),
    mobilePhone: z.string().optional().describe('Mobile phone if specified'),
    workPhone: z.string().optional().describe('Work phone if specified'),
    company: z.string().optional().describe('Company name if mentioned'),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
    }).optional().describe('Address details if provided'),
    source: z.string().default('Estait Chat').describe('Lead source'),
    categories: z.array(z.string()).optional().describe('Categories like Buyer, Seller, etc.'),
    status: z.string().optional().describe('Contact status like Hot Lead, Active, etc.'),
    notes: z.string().optional().describe('Any additional information about the lead'),
  }),
  execute: async (args) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    const contactData = {
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      mobilePhone: args.mobilePhone,
      workPhone: args.workPhone,
      company: args.company,
      address: args.address,
      source: args.source,
      categories: args.categories,
      status: args.status,
      notes: args.notes,
    };
    
    const result = await adapter.createContact(userId, contactData);
    
    // If notes were provided, add them as a separate note
    if (args.notes) {
      await adapter.createNote(
        userId,
        result.id,
        args.notes,
        'Initial Contact Notes',
        ['New Lead']
      );
    }
    
    // Get team for assignment info
    const team = await adapter.getTeam(userId);
    const assignedTo = team.length > 0 ? team[0].name : null;
    
    return {
      success: true,
      contactId: result.id,
      fullName: `${args.firstName} ${args.lastName}`,
      email: args.email,
      phone: args.phone || args.mobilePhone || args.workPhone,
      assignedTo,
      message: `✅ Created lead: ${args.firstName} ${args.lastName}${assignedTo ? ` (assigned to ${assignedTo})` : ''}`,
    };
  },
});

export const addNote = tool({
  description: 'Add a note to an existing contact in Wise Agent. Find the contact by name and add the note.',
  inputSchema: z.object({
    contactName: z.string().describe('Full or partial name of the contact'),
    noteContent: z.string().describe('The note content to add'),
    subject: z.string().optional().describe('Note subject/title'),
    categories: z.array(z.string()).optional().describe('Note categories like Buyer, Seller, Follow Up, etc.'),
  }),
  execute: async ({ contactName, noteContent, subject, categories }) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    // Search for contact
    const searchResults = await adapter.searchContacts(userId, {
      query: contactName,
      pageSize: 5,
    });
    
    if (searchResults.contacts.length === 0) {
      return {
        success: false,
        message: `❌ No contact found matching "${contactName}". Please check the name and try again.`,
      };
    }
    
    const contact = searchResults.contacts[0];
    
    // Add timestamp to note
    const timestamp = new Date().toLocaleString();
    const formattedNote = `[${timestamp}] ${noteContent}`;
    
    const note = await adapter.createNote(
      userId,
      contact.id,
      formattedNote,
      subject || 'Chat Note',
      categories || ['Chat Notes']
    );
    
    return {
      success: true,
      noteId: note.id,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      message: `✅ Note added to ${contact.firstName} ${contact.lastName}`,
    };
  },
});

export const searchContacts = tool({
  description: 'Search for contacts in Wise Agent CRM by name, email, or other criteria.',
  inputSchema: z.object({
    searchQuery: z.string().describe('Name, email, or search term'),
    categories: z.array(z.string()).optional().describe('Filter by categories'),
    limit: z.number().default(10).max(25).describe('Maximum results to return'),
  }),
  execute: async ({ searchQuery, categories, limit }) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    const results = await adapter.searchContacts(userId, {
      query: searchQuery,
      categories,
      pageSize: limit,
    });
    
    if (results.contacts.length === 0) {
      return {
        success: true,
        total: 0,
        contacts: [],
        message: `No contacts found matching "${searchQuery}". Try a different search term or create a new contact.`,
      };
    }
    
    const formattedContacts = results.contacts.map((contact) => ({
      id: contact.id,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone || contact.mobilePhone,
      company: contact.company,
      status: contact.status,
      categories: contact.categories,
    }));
    
    return {
      success: true,
      total: results.total,
      contacts: formattedContacts,
      message: `Found ${results.total} contact${results.total !== 1 ? 's' : ''} (showing ${results.contacts.length})`,
    };
  },
});

export const createTask = tool({
  description: 'Create a task or reminder in Wise Agent, optionally linked to a contact.',
  inputSchema: z.object({
    description: z.string().describe('Task description'),
    dueDate: z.string().optional().describe('Due date in natural language (e.g., tomorrow, next week, 2024-12-25)'),
    priority: z.enum(['None', 'Low', 'Medium', 'High']).default('Medium').describe('Task priority'),
    contactName: z.string().optional().describe('Contact to link task to'),
    notes: z.string().optional().describe('Additional task notes'),
  }),
  execute: async ({ description, dueDate, priority, contactName, notes }) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    let contactId: string | undefined;
    let contactFullName: string | undefined;
    
    if (contactName) {
      const searchResults = await adapter.searchContacts(userId, {
        query: contactName,
        pageSize: 1,
      });
      
      if (searchResults.contacts.length > 0) {
        const contact = searchResults.contacts[0];
        contactId = contact.id;
        contactFullName = `${contact.firstName} ${contact.lastName}`;
      }
    }
    
    // Parse natural language date
    let taskDueDate: Date | undefined;
    if (dueDate) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      if (dueDate.toLowerCase().includes('tomorrow')) {
        taskDueDate = tomorrow;
      } else if (dueDate.toLowerCase().includes('next week')) {
        taskDueDate = nextWeek;
      } else {
        taskDueDate = new Date(dueDate);
      }
    }
    
    const task = await adapter.createTask(userId, {
      description,
      dueDate: taskDueDate,
      priority,
      contactId,
      notes,
    });
    
    return {
      success: true,
      taskId: task.id,
      description,
      dueDate: taskDueDate?.toLocaleDateString(),
      priority,
      contactName: contactFullName,
      message: `✅ Task created: "${description}"${taskDueDate ? ` due ${taskDueDate.toLocaleDateString()}` : ''}${contactFullName ? ` for ${contactFullName}` : ''}`,
    };
  },
});

export const linkPropertyToContact = tool({
  description: 'Link a property from search results to a contact in Wise Agent by adding a detailed note.',
  inputSchema: z.object({
    contactName: z.string().describe('Name of the contact'),
    propertyAddress: z.string().describe('Property address'),
    propertyDetails: z.object({
      price: z.number().describe('Listing price'),
      beds: z.number().describe('Number of bedrooms'),
      baths: z.number().describe('Number of bathrooms'),
      sqft: z.number().optional().describe('Square footage'),
      mlsNumber: z.string().optional().describe('MLS listing number'),
      yearBuilt: z.number().optional(),
      propertyType: z.string().optional(),
    }),
    clientInterest: z.string().optional().describe('Notes about client interest level'),
  }),
  execute: async ({ contactName, propertyAddress, propertyDetails, clientInterest }) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    // Search for contact
    const searchResults = await adapter.searchContacts(userId, {
      query: contactName,
      pageSize: 1,
    });
    
    if (searchResults.contacts.length === 0) {
      return {
        success: false,
        message: `❌ Contact "${contactName}" not found. Please create the contact first.`,
      };
    }
    
    const contact = searchResults.contacts[0];
    
    // Create detailed note content (HTML format for Wise Agent)
    const noteContent = `
<div style="border: 1px solid #ddd; padding: 10px; margin: 10px 0;">
  <h3>Property Interest: ${propertyAddress}</h3>
  <ul>
    <li><strong>Price:</strong> $${propertyDetails.price.toLocaleString()}</li>
    <li><strong>Bedrooms:</strong> ${propertyDetails.beds}</li>
    <li><strong>Bathrooms:</strong> ${propertyDetails.baths}</li>
    ${propertyDetails.sqft ? `<li><strong>Square Feet:</strong> ${propertyDetails.sqft.toLocaleString()}</li>` : ''}
    ${propertyDetails.mlsNumber ? `<li><strong>MLS #:</strong> ${propertyDetails.mlsNumber}</li>` : ''}
    ${propertyDetails.yearBuilt ? `<li><strong>Year Built:</strong> ${propertyDetails.yearBuilt}</li>` : ''}
    ${propertyDetails.propertyType ? `<li><strong>Type:</strong> ${propertyDetails.propertyType}</li>` : ''}
  </ul>
  ${clientInterest ? `<p><strong>Client Interest:</strong> ${clientInterest}</p>` : ''}
  <p><em>Added via Estait AI on ${new Date().toLocaleString()}</em></p>
</div>
    `.trim();
    
    await adapter.createNote(
      userId,
      contact.id,
      noteContent,
      `Property Interest: ${propertyAddress}`,
      ['Property Interest', 'Active Buyer']
    );
    
    // Create follow-up task
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    await adapter.createTask(userId, {
      description: `Follow up with ${contact.firstName} about ${propertyAddress}`,
      dueDate: tomorrow,
      priority: 'High',
      contactId: contact.id,
      notes: `Property: ${propertyAddress}\nPrice: $${propertyDetails.price.toLocaleString()}\n${propertyDetails.beds}BR/${propertyDetails.baths}BA`,
    });
    
    return {
      success: true,
      contactId: contact.id,
      contactName: `${contact.firstName} ${contact.lastName}`,
      propertyAddress,
      message: `✅ Property linked to ${contact.firstName} ${contact.lastName} with follow-up task created for tomorrow`,
    };
  },
});

export const getTeam = tool({
  description: 'Get list of team members in Wise Agent for assignment purposes.',
  inputSchema: z.object({}),
  execute: async () => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    const team = await adapter.getTeam(userId);
    
    if (team.length === 0) {
      return {
        success: true,
        team: [],
        message: 'No team members found in your Wise Agent account.',
      };
    }
    
    const formattedTeam = team.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      phone: member.phone,
      jobTitle: member.jobTitle,
      type: member.type,
    }));
    
    return {
      success: true,
      team: formattedTeam,
      message: `Your Wise Agent Team (${team.length} member${team.length !== 1 ? 's' : ''}):`,
    };
  },
});

export const generateSSOLink = tool({
  description: 'Generate a one-time login link to Wise Agent (valid for 60 seconds).',
  inputSchema: z.object({
    targetPage: z.string().optional().describe('Specific page to navigate to after login'),
  }),
  execute: async ({ targetPage }) => {
    const adapter = await getWiseAgentAdapter();
    const userId = await getCurrentUserId();
    
    if (!adapter.generateSSOLink) {
      throw new Error('SSO not supported for this CRM');
    }
    
    const ssoUrl = await adapter.generateSSOLink(userId, targetPage);
    
    return {
      success: true,
      ssoUrl,
      expiresIn: 60,
      message: '🔗 Quick login link generated (expires in 60 seconds)',
    };
  },
});