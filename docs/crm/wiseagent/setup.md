# Wise Agent CRM Setup Guide

This guide will help you set up the Wise Agent CRM integration for Estait.

## Prerequisites

1. A Wise Agent account with API access enabled
2. Environment variables configured (see below)
3. Database migrations applied

## Environment Variables

Add the following to your `.env.local` file:

```bash
# Wise Agent OAuth Credentials
WISE_AGENT_CLIENT_ID=29afa25e-cce6-47ac-8375-2da7c361031a
WISE_AGENT_CLIENT_SECRET=t48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=

# Encryption key for token storage (32+ characters)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Your app URL (for OAuth redirects)
NEXT_PUBLIC_URL=http://localhost:3000  # or https://yourdomain.com in production
```

## Database Setup

1. Run the database migrations to create the CRM connections table:

```bash
pnpm db:generate
pnpm db:migrate
```

## OAuth Flow Setup

### 1. Configure Redirect URI

The OAuth redirect URI is automatically set to:
```
{NEXT_PUBLIC_URL}/api/auth/wiseagent/callback
```

For local development: `http://localhost:3000/api/auth/wiseagent/callback`

### 2. Required OAuth Scopes

The integration requests the following scopes:
- `profile` - Read user profile information
- `contacts` - Manage contacts
- `team` - Access team members
- `marketing` - Manage marketing programs
- `calendar` - Access calendar/planner
- `properties` - Manage properties

## Connecting Wise Agent

### From the UI

1. Navigate to Settings → CRM Integrations
2. Click "Connect Wise Agent"
3. Authorize the requested permissions
4. You'll be redirected back to the app once connected

### Programmatically

```typescript
// Initiate OAuth flow
const response = await fetch('/api/auth/wiseagent');
const { authUrl } = await response.json();
window.location.href = authUrl;
```

## Using the CRM Adapter

### Create a Contact

```typescript
const response = await fetch('/api/crm/contacts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    crmType: 'wise_agent',
    contact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '555-1234',
      source: 'Website',
      categories: ['Buyer', 'Hot Lead']
    }
  })
});
```

### Search Contacts

```typescript
const response = await fetch('/api/crm/contacts?email=john@example.com');
const { contacts, total } = await response.json();
```

### Add a Note

```typescript
const response = await fetch('/api/crm/notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    crmType: 'wise_agent',
    contactId: '12345',
    note: 'Interested in 3BR homes in Austin',
    subject: 'Property Interest',
    categories: ['Follow Up']
  })
});
```

## Security Considerations

1. **Token Storage**: All OAuth tokens are encrypted using AES-256-GCM before storage
2. **HTTPS Only**: Always use HTTPS in production for OAuth redirects
3. **State Parameter**: CSRF protection via OAuth state parameter
4. **Token Refresh**: Automatic token refresh before expiry
5. **Secure Sessions**: User must be authenticated to access CRM features

## Testing the Integration

### Unit Tests

```bash
pnpm test __tests__/crm/wiseagent/
```

### Integration Tests

To run integration tests with a real Wise Agent account:

```bash
TEST_INTEGRATION=true TEST_USER_ID=your-user-id pnpm test __tests__/crm/wiseagent/integration.test.ts
```

## Monitoring

- Check CRM connection status: `GET /api/crm/status`
- View error logs in Vercel dashboard
- Monitor token refresh in server logs

## Next Steps

1. Set up webhook endpoints for real-time updates
2. Configure lead routing rules
3. Set up marketing automation
4. Integrate with property search