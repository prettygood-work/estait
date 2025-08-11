import { 
  CRMAdapter, 
  Contact, 
  ContactData, 
  Note, 
  Task, 
  TaskData,
  TeamMember, 
  MarketingProgram,
  LeadSource,
  SearchParams,
  CRMError
} from '../interfaces';
import { getValidAccessToken, revokeTokens } from '@/lib/auth/wiseagent-oauth';
import { getCRMConnection, deleteCRMConnection } from '@/lib/db/queries/crm';

const API_BASE_URL = 'https://sync.thewiseagent.com/http/webconnect.asp';

export class WiseAgentAdapter implements CRMAdapter {
  name = 'Wise Agent';
  
  private async makeRequest(
    userId: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    params: Record<string, any>,
    retries = 3
  ): Promise<any> {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      throw new WiseAgentError('Not connected to Wise Agent', 'AUTH_REQUIRED', 401);
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        let url = API_BASE_URL;
        let body: FormData | URLSearchParams | undefined;
        let headers: Record<string, string> = {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        };
        
        if (method === 'GET') {
          const searchParams = new URLSearchParams(params);
          url = `${API_BASE_URL}?${searchParams}`;
        } else {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = new URLSearchParams(params);
        }
        
        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });
        
        if (response.status === 401) {
          throw new WiseAgentError('Unauthorized - token may be expired', 'UNAUTHORIZED', 401);
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new WiseAgentError(
            `API request failed: ${response.statusText}`,
            'API_ERROR',
            response.status,
            errorText
          );
        }
        
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on auth errors
        if (error instanceof WiseAgentError && error.statusCode === 401) {
          throw error;
        }
        
        // Exponential backoff for retries
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError || new WiseAgentError('Request failed after retries', 'REQUEST_FAILED');
  }
  
  async connect(userId: string): Promise<{ authUrl: string }> {
    // OAuth flow is handled by the API route
    const response = await fetch('/api/auth/wiseagent');
    const data = await response.json();
    return { authUrl: data.authUrl };
  }
  
  async disconnect(userId: string): Promise<boolean> {
    await revokeTokens(userId);
    await deleteCRMConnection(userId, 'wise_agent');
    return true;
  }
  
  async isConnected(userId: string): Promise<boolean> {
    const connection = await getCRMConnection(userId, 'wise_agent');
    return !!connection;
  }
  
  async createContact(userId: string, data: ContactData): Promise<Contact> {
    const params: Record<string, string> = {
      requestType: 'webcontact',
      CFirst: data.firstName,
      CLast: data.lastName,
      Source: data.source,
    };
    
    if (data.email) params.CEmail = data.email;
    if (data.phone) params.HomePhone = data.phone;
    if (data.mobilePhone) params.MobilePhone = data.mobilePhone;
    if (data.workPhone) params.WorkPhone = data.workPhone;
    if (data.company) params.Company = data.company;
    if (data.status) params.ContactStatus = data.status;
    if (data.rank) params.Rank = data.rank;
    
    if (data.address) {
      if (data.address.street) {
        const streetParts = data.address.street.match(/^(\d+)?\s*(.*)$/);
        if (streetParts) {
          if (streetParts[1]) params.AddressNumber = streetParts[1];
          if (streetParts[2]) params.AddressStreet = streetParts[2];
        } else {
          params.AddressStreet = data.address.street;
        }
      }
      if (data.address.city) params.City = data.address.city;
      if (data.address.state) params.State = data.address.state;
      if (data.address.zip) params.zip = data.address.zip;
      if (data.address.country) params.country = data.address.country;
    }
    
    if (data.categories && data.categories.length > 0) {
      params.Categories = data.categories.join(';');
    }
    
    const response = await this.makeRequest(userId, 'POST', params);
    
    if (!response.success) {
      throw new WiseAgentError('Failed to create contact', 'CREATE_FAILED');
    }
    
    return {
      id: response.data.ClientID.toString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      mobilePhone: data.mobilePhone,
      workPhone: data.workPhone,
      company: data.company,
      address: data.address,
      source: data.source,
      categories: data.categories,
      status: data.status,
      rank: data.rank,
    };
  }
  
  async updateContact(userId: string, id: string, data: Partial<ContactData>): Promise<Contact> {
    const params: Record<string, string> = {
      requestType: 'updateContact',
      clientID: id,
    };
    
    if (data.firstName !== undefined) params.CFirst = data.firstName;
    if (data.lastName !== undefined) params.CLast = data.lastName;
    if (data.email !== undefined) params.CEmail = data.email;
    if (data.phone !== undefined) params.HomePhone = data.phone;
    if (data.mobilePhone !== undefined) params.MobilePhone = data.mobilePhone;
    if (data.workPhone !== undefined) params.WorkPhone = data.workPhone;
    if (data.company !== undefined) params.Company = data.company;
    if (data.status !== undefined) params.ContactStatus = data.status;
    if (data.rank !== undefined) params.Rank = data.rank;
    
    if (data.address) {
      if (data.address.street !== undefined) {
        const streetParts = data.address.street.match(/^(\d+)?\s*(.*)$/);
        if (streetParts) {
          if (streetParts[1]) params.AddressNumber = streetParts[1];
          if (streetParts[2]) params.AddressStreet = streetParts[2];
        } else {
          params.AddressStreet = data.address.street;
        }
      }
      if (data.address.city !== undefined) params.City = data.address.city;
      if (data.address.state !== undefined) params.State = data.address.state;
      if (data.address.zip !== undefined) params.Zip = data.address.zip;
      if (data.address.country !== undefined) params.Country = data.address.country;
    }
    
    if (data.categories !== undefined && data.categories.length > 0) {
      params.AddCategories = data.categories.join(',');
    }
    
    await this.makeRequest(userId, 'POST', params);
    
    // Fetch updated contact
    const contact = await this.getContact(userId, id);
    if (!contact) {
      throw new WiseAgentError('Contact not found after update', 'NOT_FOUND');
    }
    
    return contact;
  }
  
  async getContact(userId: string, id: string): Promise<Contact | null> {
    const response = await this.makeRequest(userId, 'GET', {
      requestType: 'getSingleContact',
      clientID: id,
    });
    
    if (!response || response.length === 0) {
      return null;
    }
    
    const contact = response[0];
    return this.mapWiseAgentContact(contact);
  }
  
  async searchContacts(userId: string, params: SearchParams): Promise<{ contacts: Contact[]; total: number }> {
    const requestParams: Record<string, string> = {
      requestType: 'getContacts',
      page: (params.page || 1).toString(),
      page_size: (params.pageSize || 100).toString(),
    };
    
    if (params.email) requestParams.email = params.email;
    if (params.phone) requestParams.phone = params.phone.replace(/\D/g, ''); // Remove non-numeric
    if (params.query) requestParams.nameQuery = params.query;
    if (params.categories && params.categories.length > 0) {
      requestParams.categories = params.categories.join(',');
    }
    if (params.updatedSince) {
      requestParams.DateUpdatedUTC = params.updatedSince.toISOString();
    }
    
    // Get count first
    const countResponse = await this.makeRequest(userId, 'GET', {
      ...requestParams,
      requestType: 'getContactsCount',
    });
    
    const total = countResponse.count || 0;
    
    // Get contacts
    const response = await this.makeRequest(userId, 'GET', requestParams);
    
    const contacts = Array.isArray(response) 
      ? response.map(contact => this.mapWiseAgentContact(contact))
      : [];
    
    return { contacts, total };
  }
  
  async createNote(
    userId: string, 
    contactId: string, 
    note: string, 
    subject?: string, 
    categories?: string[]
  ): Promise<Note> {
    const params: Record<string, string> = {
      requestType: 'addContactNote',
      clientids: contactId,
      note: note,
    };
    
    if (subject) params.subject = subject;
    if (categories && categories.length > 0) {
      params.categories = categories.join(',');
    }
    
    const response = await this.makeRequest(userId, 'POST', params);
    
    if (!response || !response[0]?.success) {
      throw new WiseAgentError('Failed to create note', 'CREATE_FAILED');
    }
    
    const noteData = response[0].data[0];
    
    return {
      id: noteData.NoteID.toString(),
      contactId: contactId,
      subject: subject,
      content: note,
      categories: categories,
      createdAt: new Date(),
    };
  }
  
  async getNotes(userId: string, contactId: string): Promise<Note[]> {
    const response = await this.makeRequest(userId, 'GET', {
      requestType: 'getContactNotes',
      ClientID: contactId,
      page: '1',
      page_size: '100',
    });
    
    if (!Array.isArray(response)) {
      return [];
    }
    
    return response.map(note => ({
      id: note.NoteID.toString(),
      contactId: note.ClientID.toString(),
      subject: note.Subject,
      content: note.Note,
      categories: note.Categories ? JSON.parse(note.Categories).map((cat: any) => cat.name) : [],
      createdAt: new Date(note.NoteDate),
      createdBy: note.insideteamid ? `Team Member ${note.insideteamid}` : undefined,
    }));
  }
  
  async createTask(userId: string, data: TaskData): Promise<Task> {
    const params: Record<string, string> = {
      requestType: 'tasks',
      Description: data.description,
    };
    
    if (data.dueDate) {
      params.TaskDue = this.formatDate(data.dueDate);
    }
    
    if (data.priority) {
      const priorityMap = { 'None': '0', 'Low': '1', 'Medium': '2', 'High': '3' };
      params.Priority = priorityMap[data.priority] || '0';
    }
    
    if (data.contactId) {
      params.ContactID = data.contactId;
    }
    
    if (data.assignedTo) {
      params.InsideTeamId = data.assignedTo;
    }
    
    if (data.notes) {
      params.TaskNote = data.notes;
    }
    
    const response = await this.makeRequest(userId, 'POST', params);
    
    if (!response.success) {
      throw new WiseAgentError('Failed to create task', 'CREATE_FAILED');
    }
    
    return {
      id: response.TaskID.toString(),
      description: data.description,
      dueDate: data.dueDate,
      priority: data.priority || 'None',
      status: 'pending',
      contactId: data.contactId,
      assignedTo: data.assignedTo,
      createdAt: new Date(),
    };
  }
  
  async getTeam(userId: string): Promise<TeamMember[]> {
    const [insideTeam, outsideTeam] = await Promise.all([
      this.makeRequest(userId, 'GET', { requestType: 'getTeam' }),
      this.makeRequest(userId, 'GET', { requestType: 'getOutsideTeam' }),
    ]);
    
    const teamMembers: TeamMember[] = [];
    
    if (Array.isArray(insideTeam)) {
      teamMembers.push(...insideTeam.map(member => ({
        id: member.InsideTeamId.toString(),
        name: member.Name,
        email: member.Email,
        phone: member.Phone,
        cell: member.Cell,
        jobTitle: member.JobTitle,
        type: 'inside' as const,
      })));
    }
    
    if (Array.isArray(outsideTeam)) {
      teamMembers.push(...outsideTeam.map(member => ({
        id: member.Email, // Outside team uses email as ID
        name: member.TeamMember,
        email: member.Email,
        phone: member.Phone,
        cell: member.Cell,
        type: 'outside' as const,
      })));
    }
    
    return teamMembers;
  }
  
  async getMarketingPrograms(userId: string): Promise<MarketingProgram[]> {
    const response = await this.makeRequest(userId, 'GET', {
      requestType: 'getPrograms',
    });
    
    if (!Array.isArray(response)) {
      return [];
    }
    
    return response.map(program => ({
      id: program.ProgramID.toString(),
      name: program.ProgramName,
    }));
  }
  
  async addContactsToProgram(userId: string, contactIds: string[], programId: string): Promise<boolean> {
    const response = await this.makeRequest(userId, 'POST', {
      requestType: 'addClientsToMarketingProgram',
      clientids: contactIds.join(','),
      programID: programId,
    });
    
    return response[0]?.success === 'true';
  }
  
  async getLeadSources(userId: string): Promise<LeadSource[]> {
    const response = await this.makeRequest(userId, 'GET', {
      requestType: 'getSources',
    });
    
    if (!Array.isArray(response)) {
      return [];
    }
    
    return response.map(source => ({
      id: source.ID.toString(),
      name: source.Name,
    }));
  }
  
  async generateSSOLink(userId: string, targetPage?: string): Promise<string> {
    const response = await this.makeRequest(userId, 'GET', {
      requestType: 'getLoginToken',
    });
    
    if (!response || typeof response !== 'string') {
      throw new WiseAgentError('Failed to generate SSO link', 'SSO_FAILED');
    }
    
    return targetPage ? `${response}&page=${encodeURIComponent(targetPage)}` : response;
  }
  
  private mapWiseAgentContact(wiseAgentContact: any): Contact {
    const addressParts = [
      wiseAgentContact.AddressNumber,
      wiseAgentContact.AddressStreet,
    ].filter(Boolean).join(' ');
    
    return {
      id: wiseAgentContact.ClientID.toString(),
      firstName: wiseAgentContact.CFirst || '',
      lastName: wiseAgentContact.CLast || '',
      email: wiseAgentContact.CEmail,
      phone: wiseAgentContact.HomePhone,
      mobilePhone: wiseAgentContact.MobilePhone,
      workPhone: wiseAgentContact.WorkPhone,
      company: wiseAgentContact.Company,
      address: {
        street: addressParts || undefined,
        city: wiseAgentContact.City,
        state: wiseAgentContact.State,
        zip: wiseAgentContact.Zip,
        country: wiseAgentContact.Country,
      },
      source: wiseAgentContact.Source,
      categories: wiseAgentContact.Categories 
        ? JSON.parse(wiseAgentContact.Categories).map((cat: any) => cat.name)
        : [],
      status: wiseAgentContact.Status,
      rank: wiseAgentContact.Rank,
      createdAt: wiseAgentContact.DateAddedUTC ? new Date(wiseAgentContact.DateAddedUTC) : undefined,
      updatedAt: wiseAgentContact.DateUpdatedUTC ? new Date(wiseAgentContact.DateUpdatedUTC) : undefined,
      customFields: wiseAgentContact.CustomData 
        ? JSON.parse(wiseAgentContact.CustomData).reduce((acc: any, field: any) => {
            acc[field.Key] = field.Value;
            return acc;
          }, {})
        : undefined,
    };
  }
  
  private formatDate(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  }
}

class WiseAgentError extends Error implements CRMError {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'WiseAgentError';
  }
}