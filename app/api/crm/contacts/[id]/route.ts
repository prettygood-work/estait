import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getCRMAdapter } from '@/lib/crm/factory';
import { z } from 'zod';

const updateContactSchema = z.object({
  crmType: z.enum(['wise_agent']),
  contact: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
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
    categories: z.array(z.string()).optional(),
    status: z.string().optional(),
    rank: z.enum(['A', 'B', 'C', 'D', 'F', 'Unranked']).optional(),
  }),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    
    const { id } = await params;
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    const contact = await adapter.getContact(session.user.id, id);
    
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const validated = updateContactSchema.parse(body);
    
    const { id } = await params;
    const adapter = getCRMAdapter(validated.crmType);
    const contact = await adapter.updateContact(
      session.user.id,
      id,
      validated.contact
    );
    
    return NextResponse.json({ success: true, contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update contact' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const crmType = searchParams.get('crmType') || 'wise_agent';
    
    const { id } = await params;
    const adapter = getCRMAdapter(crmType as 'wise_agent');
    
    if (adapter.deleteContact) {
      await adapter.deleteContact(session.user.id, id);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Delete operation not supported for this CRM' },
        { status: 501 }
      );
    }
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete contact' },
      { status: 500 }
    );
  }
}