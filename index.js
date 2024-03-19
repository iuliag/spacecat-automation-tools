import { fetch } from '@adobe/fetch';
import { promises as fs } from 'fs';

import SpaceCatSdk from './sdk.js';
const log = console;

async function readConfig(configFilePath) {
    try {
        const jsonString = await fs.readFile(configFilePath, 'utf8');
        const config = JSON.parse(jsonString);
        log.info("Config is:", config);
        return config;
    } catch (err) {
        if (err.code === 'ENOENT') {
            log.error("Config file read failed:", err);
        } else {
            log.error('Error parsing JSON string:', err);
        }
    }
}

(async () => {
    // Assuming that the file path is the first command line argument
    const configFilePath = process.argv[2];
    const config = await readConfig(configFilePath);
    const {
        imsOrgId,
        orgName,
        siteBaseUrls,
        auditTypes,
        channelId,
        userIds,
        enableAudits,
        auditsByOrg,
        enableReports,
        reportsByOrg,
        apiBaseUrl,
        apiKey,
    } = config;

    const sdk = new SpaceCatSdk({apiBaseUrl, apiKey});
    const organization = await sdk.createOrRetrieveOrganization({imsOrgId, orgName});
    if (!organization) {
        log.error('Failed to create or retrieve organization');
        return;
    }

    if (enableAudits && auditsByOrg) {
        await sdk.configureAuditsForOrganization({organization, auditTypes, enable: enableAudits});
    }

    if (enableReports) {
        if (reportsByOrg) {
            await sdk.enableReportsAtOrganizationLevel({organization, auditTypes, channelId, userIds});
        } else {
            await sdk.enableReportsAtOrganizationLevel({organization, auditTypes, byOrg: false});
        }
    }

    const results = await Promise.all(siteBaseUrls.map(async siteBaseUrl => {
        const site = await sdk.createOrRetrieveSite({orgId: organization.id, siteBaseUrl});
        if (!site) {
            log.error('Failed to create or retrieve site');
            return;
        }

        if (enableAudits) {
            await sdk.configureAuditsForSite({site, auditTypes, enable: enableAudits});
        }

        if (enableReports) {
            if (!reportsByOrg) {
                await sdk.enableReportsAtSiteLevel({site, auditTypes, channelId, userIds, byOrg: false});
            }
        }
    }));
})();