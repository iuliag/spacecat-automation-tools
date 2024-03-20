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
        configureAudits,
        enableAudits,
        auditsByOrg,
        configureReports,
        reportsByOrg,
        apiBaseUrl,
        apiKey,
        orgId,
    } = config;

    const sdk = new SpaceCatSdk({apiBaseUrl, apiKey});

    let organization;
    if (orgId) {
        organization = await sdk.getOrganizationById(orgId);
    } else {
        organization = await sdk.createOrRetrieveOrganization({imsOrgId, orgName});
    }
    if (!organization) {
        log.error('Failed to create or retrieve organization');
        return;
    }

    if (configureAudits && auditsByOrg) {
        await sdk.configureAuditsForOrganization({organization, auditTypes, enable: enableAudits});
    }

    if (configureReports) {
        if (reportsByOrg) {
            await sdk.enableReportsAtOrganizationLevel({organization, auditTypes, byOrg: true, channelId, userIds});
        } else {
            await sdk.enableReportsAtOrganizationLevel({organization, auditTypes, byOrg: false});
        }
    }

    await Promise.all(siteBaseUrls.map(async (siteBaseUrl) => {
        const site = await sdk.createOrRetrieveSite({orgId: organization.id, siteBaseUrl});
        if (!site) {
            log.error('Failed to create or retrieve site');
            return;
        }
        // if the site is already created, assumption is that it has the correct organizationId set

        if (configureAudits) {
            await sdk.configureAuditsForSite({site, auditTypes, enable: enableAudits});
        }

        if (configureReports) {
            if (!reportsByOrg) {
                await sdk.enableReportsAtSiteLevel({site, auditTypes, channelId, userIds, byOrg: false});
            }
        }
    }));
})();
