import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const createContactSchema = z.object({
  crmType: z.enum(['wise_agent']),
  contact: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    mobilePhone: z.string().optional(),
    workPhone: z.string().optional(),
    company: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    source: z.string().min(1),
    categories: z.array(z.string()).optional(),
    status: z.string().optional(),
    rank: z.enum(['A', 'B', 'C', 'D', 'F', 'Unranked']).optional(),
    notes: z.string().optional(),
  }),
});

const searchContactsSchema = z.object({
  crmType: z.enum(['wise_agent']),
  query: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  categories: z.array(z.string()).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  updatedSince: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = createContactSchema.parse(body);
    
    const adapter = getCRMAdapter(validated.crmType);
    const contact = await adapter.createContact(session.user.id, validated.contact);
    
    return NextResponse.json({ success: true, contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create contact' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const params = {
      crmType: searchParams.get('crmType') || 'wise_agent',
      query: searchParams.get('query') || undefined,
      email: searchParams.get('email') || undefined,
      phone: searchParams.get('phone') || undefined,
      categories: searchParams.get('categories')?.split(','),
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : undefined,
      updatedSince: searchParams.get('updatedSince') || undefined,
    };
    
    const validated = searchContactsSchema.parse(params);
    
    const adapter = getCRMAdapter(validated.crmType);
    const result = await adapter.searchContacts(session.user.id, {
      query: validated.query,
      email: validated.email,
      phone: validated.phone,
      categories: validated.categories,
      page: validated.page,
      pageSize: validated.pageSize,
      updatedSince: validated.updatedSince ? new Date(validated.updatedSince) : undefined,
    });
    
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to search contacts' },
      { status: 500 }
    );
  }
}