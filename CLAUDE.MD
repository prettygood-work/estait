# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Estait is a mobile-first conversational AI assistant for real estate agents that integrates with CRM systems (starting with Wise Agent) and MLS property data (via RealEstateAPI.com). Built on the Vercel AI Chatbot template with Next.js 15.3.

**Current Status**: Base chatbot functionality implemented. Real estate features in Phase 1 development.

## Development Commands

```bash
# Development
pnpm dev                 # Start development server (port 3000)
pnpm build              # Build for production (runs migrations first)
pnpm start              # Start production server

# Code Quality
pnpm lint               # Check linting errors
pnpm lint:fix           # Auto-fix linting issues
pnpm format             # Format code with Biome

# Database
pnpm db:generate        # Generate Drizzle migrations
pnpm db:migrate         # Apply migrations to database
pnpm db:studio          # Open Drizzle Studio GUI
pnpm db:push            # Push schema changes directly
pnpm db:pull            # Pull schema from database

# Testing
pnpm test               # Run Playwright E2E tests
```

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3 (App Router), React 19 RC, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, Vercel Edge Functions
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **AI**: Vercel AI SDK with xAI Grok models (configurable)
- **Auth**: NextAuth.js v5 beta
- **Code Quality**: Biome for linting/formatting

### Key Directories
```
/app
  /(auth)              # Authentication pages and logic
  /(chat)              # Main chat interface
  /api                 # API routes (auth, chat, documents)
/components
  /custom              # Business logic components
  /ui                  # Reusable UI primitives
/lib
  /ai                  # AI models, providers, tools
    /providers         # AI provider configurations
    /tools             # Tool definitions (weather, documents)
  /db                  # Database schema and queries
    /schema.ts         # Drizzle schema definitions
    /queries           # Data access functions
/artifacts             # Document handling system
```

### Database Schema (Current)
- **users**: Authentication and profile data
- **chats**: Chat sessions with visibility settings
- **messages**: Chat messages with multi-part support
- **documents**: Text/code/image/sheet artifacts
- **suggestions**: Document editing suggestions
- **votes**: User feedback on messages

### Database Schema (Planned for Real Estate)
- **crm_connections**: OAuth tokens for CRM integrations
- **property_searches**: Saved property search results
- **property_contact_links**: Links between properties and contacts

## API Integrations

### Wise Agent CRM (OAuth 2.0) - To Be Implemented
```
Client ID: 29afa25e-cce6-47ac-8375-2da7c361031a
OAuth Base: https://sync.thewiseagent.com/WiseAuth/
API Base: https://sync.thewiseagent.com/http/webconnect.asp
Key Methods: webcontact, clist, addNote, getTeam, addTask
```

### RealEstateAPI.com - To Be Implemented
```
Test API Key: STOYC-1db8-7e5d-b2ff-92045cf12576
Search: https://api.realestateapi.com/v2/MLSSearch
Detail: https://api.realestateapi.com/v2/MLSDetail
```

## Environment Variables

```bash
# Required
POSTGRES_URL=                    # PostgreSQL connection string
AUTH_SECRET=                     # NextAuth secret (32+ chars)

# AI Provider (choose one)
XAI_API_KEY=                     # xAI API key (default)
OPENAI_API_KEY=                  # OpenAI API key
ANTHROPIC_API_KEY=               # Anthropic API key

# Optional Features
REDIS_URL=                       # For resumable streams
VERCEL_BLOB_READ_WRITE_TOKEN=    # For file uploads
UPSTASH_REDIS_REST_URL=          # Rate limiting
UPSTASH_REDIS_REST_TOKEN=        # Rate limiting

# Real Estate APIs (Future)
WISE_AGENT_CLIENT_ID=29afa25e-cce6-47ac-8375-2da7c361031a
WISE_AGENT_CLIENT_SECRET=        # OAuth secret
REALESTATE_API_KEY=              # MLS data access
ENCRYPTION_KEY=                  # For token encryption
```

## Key Implementation Patterns

### AI Tool Structure
Tools are defined in `/lib/ai/tools/` with:
1. Zod schema for parameters
2. Execute function returning UI components
3. Optional `experimental_toToolResultContent` for formatting

### Database Queries
Use the query pattern in `/lib/db/queries/`:
```typescript
// Always use prepared statements
export async function getContactsByUserId(userId: string) {
  return db.select().from(contacts).where(eq(contacts.userId, userId));
}
```

### API Routes
Standard pattern for API endpoints:
```typescript
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const body = await request.json();
  const validated = schema.parse(body);
  
  try {
    // Implementation
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

### Component Patterns
- Server Components by default
- Client Components only when needed (interactivity)
- Use `cn()` utility for conditional Tailwind classes
- Mobile-first responsive design

## Testing Strategy

### E2E Tests (Playwright)
- Test files in `/tests/`
- Focus on critical user flows
- Run against local dev server

### Manual Testing Checklist
1. Authentication flow (login/logout)
2. Chat message sending/receiving
3. Document creation and editing
4. Mobile responsiveness
5. Theme switching

## Performance Targets
- Chat response: < 2 seconds
- Page load: < 1.5 seconds
- Lighthouse score: > 90
- Mobile-first optimization

## Current Development Focus

### Phase 1 - CRM Integration (In Progress)
1. Implement OAuth flow for Wise Agent
2. Create CRM adapter pattern
3. Add contact management tools
4. Build task creation interface

### Phase 2 - Property Search (Next)
1. Integrate RealEstateAPI.com
2. Create property search UI
3. Add property detail views
4. Implement saved searches

### Phase 3 - Integration (Future)
1. Link properties to contacts
2. Create property tours
3. Add follow-up automation
4. Build analytics dashboard

## Common Development Tasks

### Add New AI Tool
1. Create tool file in `/lib/ai/tools/`
2. Define parameters with Zod schema
3. Implement execute function
4. Add to tools registry
5. Update system prompt if needed

### Add Database Table
1. Define schema in `/lib/db/schema.ts`
2. Run `pnpm db:generate` to create migration
3. Run `pnpm db:migrate` to apply
4. Create queries in `/lib/db/queries/`
5. Add TypeScript types if needed

### Implement API Endpoint
1. Create route file in `/app/api/`
2. Add authentication check
3. Validate input with Zod
4. Implement business logic
5. Return consistent JSON responses

## Troubleshooting

### Database Issues
- Check `POSTGRES_URL` is correct
- Run `pnpm db:push` for quick schema sync
- Use `pnpm db:studio` to inspect data

### Build Errors
- Clear `.next` directory
- Check TypeScript errors with `pnpm tsc`
- Verify environment variables

### Authentication Problems
- Ensure `AUTH_SECRET` is set
- Check session in server components
- Verify middleware configuration