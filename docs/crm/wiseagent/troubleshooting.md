# Wise Agent CRM Troubleshooting Guide

## Common Issues and Solutions

### OAuth Connection Issues

#### "Invalid state parameter" Error

**Cause**: The OAuth state cookie may have expired or been cleared.

**Solution**:
1. Clear browser cookies for your domain
2. Try connecting again
3. Ensure cookies are enabled in your browser

#### "Failed to exchange code for tokens" Error

**Cause**: Authorization code may have expired or OAuth credentials are incorrect.

**Solution**:
1. Verify `WISE_AGENT_CLIENT_ID` and `WISE_AGENT_CLIENT_SECRET` in `.env.local`
2. Ensure the redirect URI matches exactly
3. Try the connection flow again within 60 seconds

### Token Issues

#### "Not connected to Wise Agent" Error

**Cause**: No valid CRM connection exists for the user.

**Solution**:
```typescript
// Check connection status
const response = await fetch('/api/crm/status');
const { crms } = await response.json();
const wiseAgent = crms.find(crm => crm.type === 'wise_agent');
if (!wiseAgent.connected) {
  // Redirect to connect
}
```

#### "Failed to get valid access token" Error

**Cause**: Token refresh failed or refresh token is invalid.

**Solution**:
1. Disconnect and reconnect Wise Agent
2. Check server logs for specific refresh errors
3. Verify tokens haven't been revoked in Wise Agent

### API Request Issues

#### 401 Unauthorized Errors

**Cause**: Access token is expired or invalid.

**Solution**:
- The system should automatically refresh tokens
- If persists, disconnect and reconnect
- Check if Wise Agent API access is still enabled

#### Rate Limiting

**Cause**: Too many API requests in a short period.

**Solution**:
- Implement request queuing
- Add delays between bulk operations
- Use batch endpoints where available

#### "Contact not found after update" Error

**Cause**: Contact may have been deleted or merged in Wise Agent.

**Solution**:
1. Verify contact exists in Wise Agent UI
2. Check if contact ID is correct
3. Search by email instead of ID

### Data Issues

#### Missing Categories or Custom Fields

**Cause**: Categories may not exist in Wise Agent or JSON parsing failed.

**Solution**:
```typescript
// Ensure categories exist first
const response = await fetch('/api/crm/categories');
const { categories } = await response.json();
// Create missing categories if needed
```

#### Phone Number Format Errors

**Cause**: Wise Agent expects numeric-only phone numbers for search.

**Solution**:
```typescript
// Clean phone numbers before search
const cleanPhone = phone.replace(/\D/g, '');
```

### Debugging Tips

#### Enable Detailed Logging

Add to your API routes:
```typescript
console.log('CRM Request:', {
  method: request.method,
  params: searchParams.toString(),
  userId: session.user.id,
  timestamp: new Date().toISOString()
});
```

#### Check Token Expiry

```typescript
const connection = await getCRMConnection(userId, 'wise_agent');
console.log('Token expires at:', connection.expiresAt);
console.log('Time until expiry:', connection.expiresAt - new Date());
```

#### Test API Connectivity

```bash
# Test with curl
curl -X GET "https://sync.thewiseagent.com/http/webconnect.asp?requestType=getUser" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Accept: application/json"
```

### Database Issues

#### Migration Errors

**Solution**:
```bash
# Reset and rerun migrations
pnpm db:push
pnpm db:migrate
```

#### Encryption Key Issues

**Cause**: `ENCRYPTION_KEY` not set or changed.

**Solution**:
1. Ensure `ENCRYPTION_KEY` is set in environment
2. If key was changed, users need to reconnect
3. Use the same key across all environments

### Performance Issues

#### Slow Contact Search

**Solution**:
1. Use pagination with smaller page sizes
2. Search by specific fields (email, phone) instead of general query
3. Implement result caching

#### Token Refresh Delays

**Solution**:
1. Refresh tokens proactively (5 minutes before expiry)
2. Cache valid tokens in memory
3. Implement token refresh queue

## Error Codes Reference

| Error Code | Description | Solution |
|------------|-------------|----------|
| `AUTH_REQUIRED` | User not authenticated | Log in and try again |
| `CRM_NOT_CONNECTED` | CRM not connected | Connect Wise Agent in settings |
| `TOKEN_INVALID` | Invalid or expired token | Reconnect CRM |
| `CREATE_FAILED` | Failed to create resource | Check required fields and permissions |
| `API_ERROR` | Wise Agent API error | Check logs for details |
| `REQUEST_FAILED` | Network or timeout error | Retry request |

## Getting Help

1. Check server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with Wise Agent API documentation examples
4. Contact Wise Agent support for API-specific issues

## Monitoring Checklist

- [ ] OAuth tokens refreshing successfully
- [ ] API requests completing within timeout (30s)
- [ ] Error rate below 1%
- [ ] Token encryption/decryption working
- [ ] Database connections stable