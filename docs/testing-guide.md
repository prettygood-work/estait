# Estait AI Testing Guide

## Quick Start

1. **Set up environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Add your API keys
   OPENAI_API_KEY=your-openai-api-key
   WISE_AGENT_CLIENT_ID=29afa25e-cce6-47ac-8375-2da7c361031a
   WISE_AGENT_CLIENT_SECRET=t48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=
   POSTGRES_URL=your-postgres-url
   AUTH_SECRET=your-auth-secret
   ENCRYPTION_KEY=your-32-character-encryption-key
   ```

2. **Run database migrations**
   ```bash
   pnpm db:migrate
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   ```

4. **Open the app**
   Navigate to http://localhost:3000

## Testing Wise Agent Integration

### 1. Connect Wise Agent

1. Go to Settings → Integrations
2. Click "Connect" on the Wise Agent card
3. Authorize the OAuth connection
4. You'll be redirected back with "Connected" status

### 2. Test Chat Commands

Try these commands in the chat:

#### Create Lead
```
Create lead Sarah Johnson, phone 555-1234, email sarah@example.com, interested in buying a home
```

#### Add Note
```
Add note to Sarah Johnson that she's looking for 3 bedroom homes in Austin under 500k
```

#### Search Contacts
```
Search for contacts named Johnson
```

#### Create Task
```
Create task to follow up with Sarah tomorrow at 2pm about property tours
```

#### Link Property
```
Link property 123 Main St, Austin TX to Sarah Johnson, $450,000, 3 beds, 2 baths
```

#### View Team
```
Show my team members
```

#### Quick Login
```
Generate Wise Agent login link
```

### 3. Test Error Handling

#### Not Connected
1. Disconnect Wise Agent in Settings
2. Try a CRM command
3. Should see: "Please connect your Wise Agent account first"

#### Invalid Contact
```
Add note to NonExistentPerson about something
```
Should see: "No contact found matching..."

## Troubleshooting

### OpenAI Not Working
- Check `OPENAI_API_KEY` is set correctly
- Check console for API errors
- Verify key has GPT-4 access

### Wise Agent Connection Failed
- Verify client ID and secret are correct
- Check redirect URI matches your app URL
- Ensure OAuth scopes include: contacts, team, marketing, profile, calendar, properties

### Chat Not Responding
1. Check browser console for errors
2. Check server logs: `pnpm dev`
3. Verify database connection
4. Check API keys are valid

## Development Tips

### Check Connection Status
```javascript
// In browser console
fetch('/api/crm/status').then(r => r.json()).then(console.log)
```

### Test Tool Execution
```javascript
// Test a specific tool
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'test-chat',
    message: {
      role: 'user',
      parts: [{ type: 'text', text: 'Show my team members' }]
    },
    selectedChatModel: 'chat-model',
    selectedVisibilityType: 'private'
  })
})
```

### Monitor Token Usage
Check server logs for token usage after each message:
```
Token usage: { total: 245, prompt: 180, completion: 65 }
```

## Running Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# Specific test file
pnpm test wise-agent-integration
```

## Common Issues

1. **"No AI provider configured"**
   - Solution: Add OPENAI_API_KEY to .env.local

2. **"Wise Agent not connected"**
   - Solution: Complete OAuth flow in Settings → Integrations

3. **Tools not executing**
   - Check tool names match in chat route
   - Verify Wise Agent connection status
   - Check server logs for errors

4. **OAuth callback error**
   - Verify NEXT_PUBLIC_URL matches your app URL
   - Check redirect URI in OAuth settings

## Performance Tips

1. Use GPT-3.5 Turbo for faster responses
2. Implement caching for frequent queries
3. Batch contact operations when possible
4. Monitor rate limits for both OpenAI and Wise Agent

## Security Checklist

- [ ] Never commit .env.local
- [ ] Keep ENCRYPTION_KEY secure
- [ ] Use HTTPS in production
- [ ] Rotate API keys regularly
- [ ] Monitor OAuth token expiry