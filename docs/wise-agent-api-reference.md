# Wise Agent CRM API Reference

This document provides a complete reference for integrating with the Wise Agent CRM API using OAuth 2.0.

## OAuth Client Information

```
Client ID: 29afa25e-cce6-47ac-8375-2da7c361031a
Client Secret: t48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=
```

## API Endpoints

- **API Base URL**: `https://sync.thewiseagent.com/http/webconnect.asp`
- **OAuth Authorization URL**: `https://sync.thewiseagent.com/WiseAuth/auth`
- **OAuth Token URL**: `https://sync.thewiseagent.com/WiseAuth/token`
- **OAuth Revoke URL**: `https://sync.thewiseagent.com/WiseAuth/revoke`

## OAuth 2.0 Authentication Flow

### Available Scopes

- `profile`: Read profile information including Email, Name, Company
- `team`: Read or Update inside team members / update inside team assignments
- `marketing`: Read or Update marketing programs
- `contacts`: Read, Update, or Create contacts
- `properties`: Read or Update properties
- `calendar`: Read or Update Calendar/Planner

### Step 1: Retrieve Authorization Code

Send user to the authorization URL with the following query parameters:

```
https://sync.thewiseagent.com/WiseAuth/auth?
  client_id=29afa25e-cce6-47ac-8375-2da7c361031a&
  redirect_uri=YOUR_REDIRECT_URI&
  response_type=code&
  scope=profile contacts team marketing properties calendar
```

### Step 2: Exchange Code for Access Token

Once the user authorizes, exchange the authorization code for an access token:

```bash
POST https://sync.thewiseagent.com/WiseAuth/token
Content-Type: application/json

{
  "client_id": "29afa25e-cce6-47ac-8375-2da7c361031a",
  "client_secret": "t48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=",
  "code": "AUTHORIZATION_CODE",
  "grant_type": "authorization_code"
}
```

Response:
```json
{
  "access_token": "YOUR_ACCESS_TOKEN",
  "expires_at": "2020-01-01T00:00:00.000Z",
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### Step 3: Refresh Access Token

When the access token expires, refresh it:

```bash
POST https://sync.thewiseagent.com/WiseAuth/token
Content-Type: application/json

{
  "grant_type": "refresh_token",
  "refresh_token": "YOUR_REFRESH_TOKEN"
}
```

### Step 4: Make API Requests

Include the access token in the Authorization header:

```bash
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Revoke Access

To disconnect the OAuth app:

```bash
POST https://sync.thewiseagent.com/WiseAuth/revoke
Content-Type: application/x-www-form-urlencoded

token=YOUR_ACCESS_TOKEN&token_type_hint=access_token
```

## API Methods Reference

### User & Team Management

#### getUser
Get current user profile information.

**Required Scope**: `profile`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?requestType=getUser
```

Response:
```json
[{
  "First": "John",
  "Last": "Doe",
  "Email": "john@example.com"
}]
```

#### getTeam
Get list of inside team members.

**Required Scope**: `team`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?requestType=getTeam
```

Response:
```json
[{
  "InsideTeamId": 1,
  "Name": "Team Member Name",
  "Phone": "123-456-7890",
  "Cell": "123-456-7891",
  "Email": "agent@wiseagent.com",
  "JobTitle": "Broker"
}]
```

#### getOutsideTeam
Get list of outside team members.

**Required Scope**: `team`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?requestType=getOutsideTeam
```

### Contact Management

#### webcontact (Add Contact)
Create a new contact or update existing.

**Required Scope**: `contacts`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=webcontact&
CFirst=John&
CLast=Smith&
CEmail=john@example.com&
MobilePhone=555-1234&
Source=API&
Categories=Buyer;Seller&
InsideTeamId=1
```

Important fields:
- `CFirst`: First name (required)
- `CLast`: Last name (required)
- `CEmail`: Email address
- `HomePhone`, `MobilePhone`, `WorkPhone`: Phone numbers
- `Source`: Source of contact (required)
- `Categories`: Semicolon-delimited categories
- `InsideTeamId`: Team member assignment
- `ContactStatus`: Contact status
- `Rank`: A, B, C, D, F, or Unranked

Response:
```json
{
  "success": "true",
  "data": {
    "ClientID": 1854784,
    "NewContact": true
  }
}
```

#### getContacts
Search and retrieve contacts.

**Required Scope**: `contacts`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=getContacts&
  page=1&
  page_size=100&
  email=john@example.com
```

Query parameters:
- `email`: Search by email
- `phone`: Search by phone (numeric only)
- `categories`: Comma-delimited categories
- `nameQuery`: Search first/last/company name
- `page`: Page number (starts at 1)
- `page_size`: Results per page (default 100)

#### getSingleContact
Get detailed information for a specific contact.

**Required Scope**: `contacts`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=getSingleContact&
  clientID=1234
```

#### updateContact
Update an existing contact.

**Required Scope**: `contacts`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=updateContact&
clientID=1234&
CFirst=John&
CLast=Smith&
ContactStatus=Active&
Rank=A
```

### Contact Notes

#### addContactNote
Add a note to one or more contacts.

**Required Scope**: `contacts`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=addContactNote&
note=Interested in 3BR homes&
subject=Property Interest&
clientids=1234,5678&
categories=Hot Lead,Buyer
```

#### getContactNotes
Retrieve notes for a contact.

**Required Scope**: `contacts`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=getContactNotes&
  ClientID=1234&
  page=1&
  page_size=100
```

### Task Management

#### tasks (GET)
Retrieve tasks.

**Required Scope**: `team`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=tasks&
  page=1&
  page_size=100
```

#### tasks (POST)
Create a new task.

**Required Scope**: `team`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=tasks&
Description=Follow up with client&
TaskDue=12/31/2024&
Priority=2&
InsideTeamId=1&
ContactID=1234
```

Priority values:
- 0: None
- 1: Low
- 2: Medium
- 3: High

### Property Management

#### getProperty
Get property details.

**Required Scope**: `properties`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=getProperty&
  propertyID=12434
```

#### addProperty
Add a new property.

**Required Scope**: `properties`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=addProperty&
AddressNum=123&
Address=Main St&
City=Austin&
State=TX&
Zip=78701&
ListingPrice=500000&
NumBedrooms=3&
NumBathrooms=2&
SquareFt=2000
```

#### addPropertyConnection
Link a property to a contact.

**Required Scope**: `properties`, `contacts`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=addPropertyConnection&
PropertyID=12434&
ClientID=1234&
ClientRelation=Interested
```

### Calendar Management

#### getCalendar
Retrieve calendar events.

**Required Scope**: `calendar`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?
  requestType=getCalendar&
  startDate=01/01/2024 00:00&
  endDate=01/31/2024 23:59
```

### Marketing

#### getPrograms
Get available marketing programs.

**Required Scope**: `marketing`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?requestType=getPrograms
```

#### addClientsToMarketingProgram
Add contacts to a marketing program.

**Required Scope**: `marketing`

```bash
POST https://sync.thewiseagent.com/http/webconnect.asp
Content-Type: application/x-www-form-urlencoded

requestType=addClientsToMarketingProgram&
clientids=1234,5678&
programID=235
```

### Single Sign-On (SSO)

#### getLoginToken
Generate a temporary SSO link.

**Required Scope**: `profile`

```bash
GET https://sync.thewiseagent.com/http/webconnect.asp?requestType=getLoginToken
```

Response: A URL that expires in 60 seconds:
```
https://www.thewiseagent.com/secure/login_secure?accesstoken=TEMP_TOKEN
```

## Common Values

### Contact Status Values
- New
- Attempted
- Contacted
- Active
- Future Opportunity
- Disqualified
- Bad Lead
- Closed
- No Status
- Inactive
- Under Contract
- Hot Lead
- Warm Lead
- Appointment Set
- Showing Homes
- Submitted Offers
- Nurture
- Rejected
- Met with Client
- Listing Agreement
- Active Listing

### Contact Rank Values
- A
- B
- C
- D
- F
- Unranked

### Vendor Types
- Appraisal
- Cooperating-Agent
- Home-Inspection
- Homeowners-Insurance
- Home-Warranty
- Mortgage
- Pest-Inspection
- Title
- Seller
- Buyer
- Other

## Error Handling

### OAuth Errors
```json
{
  "error": "invalid_grant",
  "error_description": "The token has expired"
}
```

### API Errors
- 401 Unauthorized: Invalid or expired access token
- 404 Not Found: Resource not found
- 400 Bad Request: Invalid parameters

## Rate Limiting

The API implements rate limiting. Implement exponential backoff when encountering rate limit errors.

## Best Practices

1. **Source Management**: Always provide a unique source for each lead origin to enable proper automation in Wise Agent.

2. **Category Usage**: Use categories to segment contacts for targeted marketing and automation.

3. **Team Assignment**: Use `InsideTeamId` from getTeam response for accurate team member assignment.

4. **Pagination**: Always implement pagination for list endpoints to handle large datasets.

5. **Error Handling**: Implement retry logic with exponential backoff for transient errors.

6. **Token Management**: Store refresh tokens securely and implement automatic token refresh before expiration.

7. **Webhook Implementation**: Use webhooks for real-time updates instead of polling when possible.

## Example Integration Flow

```javascript
// 1. OAuth Authorization
const authUrl = `https://sync.thewiseagent.com/WiseAuth/auth?
  client_id=29afa25e-cce6-47ac-8375-2da7c361031a&
  redirect_uri=${encodeURIComponent(redirectUri)}&
  response_type=code&
  scope=profile contacts team marketing properties calendar`;

// 2. Exchange code for token
const tokenResponse = await fetch('https://sync.thewiseagent.com/WiseAuth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: '29afa25e-cce6-47ac-8375-2da7c361031a',
    client_secret: 't48/pe1i3uYKlSqwXv70bh91SgGFf9XhE2LKDnimEwI=',
    code: authorizationCode,
    grant_type: 'authorization_code'
  })
});

// 3. Make API request
const contactResponse = await fetch('https://sync.thewiseagent.com/http/webconnect.asp?requestType=getContacts', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});
```