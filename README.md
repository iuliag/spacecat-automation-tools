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
  "enableAudits": true, // if you want to enable audits, false does not disabled audits, just does not update them
  "auditsByOrg": false,
  "enableReports": true, // if you want to enable reports, false does not disabled reports, just does not update them
  "reportsByOrg": false,
  "apiBaseUrl": "https://spacecat.experiencecloud.live/api/ci",
  "apiKey": "your-api-key"
}
```

## Usage
```bash
node index.js config.json
```
