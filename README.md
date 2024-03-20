# SpaceCat Automation Tools

## Configuration
```json
{
  "imsOrgId": "some-ims-org-id",
  "orgName": "some org name",
  "siteBaseUrls": ["https://example.com"],
  "channelId": "some-channel-id",
  "userIds": ["some-user-id"],
  "auditTypes": ["broken-backlinks"],
  "configureAudits": true,
  "enableAudits": true,
  "auditsByOrg": false,
  "configureReports": true,
  "reportsByOrg": false,
  "apiBaseUrl": "https://spacecat.experiencecloud.live/api/ci",
  "apiKey": "your-api-key"
}
```

## Usage
```bash
node index.js config.json
```
