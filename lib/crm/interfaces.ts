export interface ContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  source: string;
  categories?: string[];
  status?: string;
  rank?: 'A' | 'B' | 'C' | 'D' | 'F' | 'Unranked';
  notes?: string;
  customFields?: Record<string, any>;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  workPhone?: string;
  company?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  source?: string;
  categories?: string[];
  status?: string;
  rank?: string;
  createdAt?: Date;
  updatedAt?: Date;
  customFields?: Record<string, any>;
}

export interface Note {
  id: string;
  contactId: string;
  subject?: string;
  content: string;
  categories?: string[];
  createdAt: Date;
  createdBy?: string;
}

export interface TaskData {
  description: string;
  dueDate?: Date;
  priority?: 'None' | 'Low' | 'Medium' | 'High';
  contactId?: string;
  assignedTo?: string;
  notes?: string;
}

export interface Task {
  id: string;
  description: string;
  dueDate?: Date;
  priority: string;
  status: 'pending' | 'completed';
  contactId?: string;
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cell?: string;
  jobTitle?: string;
  type?: 'inside' | 'outside';
}

export interface MarketingProgram {
  id: string;
  name: string;
  description?: string;
}

export interface LeadSource {
  id: string;
  name: string;
}

export interface SearchParams {
  query?: string;
  email?: string;
  phone?: string;
  categories?: string[];
  page?: number;
  pageSize?: number;
  updatedSince?: Date;
}

export interface CRMAdapter {
  name: string;
  
  // Connection management
  connect(userId: string): Promise<{ authUrl: string }>;
  disconnect(userId: string): Promise<boolean>;
  isConnected(userId: string): Promise<boolean>;
  
  // Contact operations
  createContact(userId: string, data: ContactData): Promise<Contact>;
  updateContact(userId: string, id: string, data: Partial<ContactData>): Promise<Contact>;
  getContact(userId: string, id: string): Promise<Contact | null>;
  searchContacts(userId: string, params: SearchParams): Promise<{ contacts: Contact[]; total: number }>;
  deleteContact?(userId: string, id: string): Promise<boolean>;
  
  // Note operations
  createNote(userId: string, contactId: string, note: string, subject?: string, categories?: string[]): Promise<Note>;
  getNotes(userId: string, contactId: string): Promise<Note[]>;
  
  // Task operations
  createTask(userId: string, data: TaskData): Promise<Task>;
  updateTask?(userId: string, taskId: string, data: Partial<TaskData>): Promise<Task>;
  getTasks?(userId: string, contactId?: string): Promise<Task[]>;
  
  // Team operations
  getTeam(userId: string): Promise<TeamMember[]>;
  
  // Marketing operations
  getMarketingPrograms?(userId: string): Promise<MarketingProgram[]>;
  addContactsToProgram?(userId: string, contactIds: string[], programId: string): Promise<boolean>;
  
  // Lead sources
  getLeadSources?(userId: string): Promise<LeadSource[]>;
  
  // Single Sign-On
  generateSSOLink?(userId: string, targetPage?: string): Promise<string>;
}

export interface CRMError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}