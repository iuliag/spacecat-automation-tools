import pkg from 'base-64';
const { encode } = pkg;

export default class SpaceCatSdk {
    constructor(config, log = console) {
        this.config = config;
        this.config.headers = {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey,
        };
        this.log = log;
    }

    async callApi({url = '/', method = 'GET', headers = this.config.headers, body = {}}) {
        try {
            this.log.info(`Calling API with URL: ${url}, method: ${method}, body: ${JSON.stringify(body)}`);
            
            const response = await fetch(url, {
                method,
                headers,
                ...(method === 'GET' ? {}: { body: JSON.stringify(body) }),
            });
    
            if (!response.ok) {
                if (response.status === 404) {
                    this.log.warn(`Resource not found: ${url}`);
                    return null;
                }
                throw new Error(`Request failed with status code ${response.status}`);
            }
    
            const responseData = await response.json();
            this.log.info(`API call successful. Response: ${JSON.stringify(responseData)}`);
            
            return responseData;
        } catch (error) {
            this.log.error(`Error in API call. URL: ${url}, method: ${method}, body: ${JSON.stringify(body)}. Error: ${error.message}`);
            throw error;
        }
    }
    
    async getOrganization(imsOrgId) {
        try {
            const url = `${this.config.apiBaseUrl}/organizations/by-ims-org-id/${imsOrgId}`;
            const responseData = await this.callApi({url});
    
            if (!responseData) {
                return null;
            }
    
            return {
                id: responseData?.id,
                config: responseData?.config
            };
        } catch (error) {
            this.log.error(`Error in getOrganization function. Error: ${error.message}`);
            throw error;
        }
    }
    
    async createOrganization({imsOrgId, orgName}) {
        try {
            const url = `${this.config.apiBaseUrl}/organizations`;
            const body = {
                name: orgName,
                imsOrgId: imsOrgId
            };
    
            const responseData = await this.callApi({url, method: 'POST', body});
    
            if (!responseData) {
                return null;
            }
    
            return {
                id: responseData?.id,
                config: responseData?.config
            };
        } catch (error) {
            this.log.error(`Error in createOrganization function. Error: ${error.message}`);
            throw error;
        }
    }
    
    async getSite(siteBaseUrl) {
        try {
            const base64EncodedUrl = encode(siteBaseUrl);
            const url = `${this.config.apiBaseUrl}/sites/by-base-url/${base64EncodedUrl}`;
    
            const responseData = await this.callApi({url});
    
            if (!responseData) {
                return null;
            }
    
            return {
                id: responseData?.id,
                config: responseData?.config,
                auditConfig: responseData?.auditConfig,
            };
        } catch (error) {
            this.log.error(`Error in getSite function. Error: ${error.message}`);
            throw error;
        }
    }
    
    async createSite({orgId, siteBaseUrl}) {
        try {
            const url = `${this.config.apiBaseUrl}/sites`;
            const body = {
                organizationId: orgId,
                baseURL: siteBaseUrl
            };
    
            const responseData = await this.callApi({url, method: 'POST', body});
    
            if (!responseData) {
                return null;
            }
    
            return {
                id: responseData?.id,
                config: responseData?.config,
                auditConfig: responseData?.auditConfig,
            };
        } catch (error) {
            this.log.error(`Error in createSite function. Error: ${error.message}`);
            throw error;
        }
    }
    
    async createOrRetrieveOrganization({imsOrgId, orgName}) {
        try {
            let organization = await this.getOrganization(imsOrgId);
            if (organization) {
                return organization;
            }
            organization = await this.createOrganization({imsOrgId, orgName});
            return organization;
        } catch (error) {
            this.log.error(`Error in createOrRetrieveOrganization function. Error: ${error.message}`);
            throw error;
        }
    }
    
    async createOrRetrieveSite({orgId, siteBaseUrl}) {
        try {
            let site = await this.getSite(siteBaseUrl);
            if (site) {
                return site;
            }
            site = await this.createSite({orgId, siteBaseUrl});
            return site;
        } catch (error) {
            this.log.error(`Error in createOrRetrieveSite function. Error: ${error.message}`);
            throw error;
        }
    }
    
    static updateAuditsConfig({auditConfig = {}, auditTypes = [], enable = true}) {
        const updatedAuditConfig = { ...auditConfig };
        updatedAuditConfig.auditsDisabled = !enable; // Enable or disable audits for all sites
        updatedAuditConfig.auditTypeConfigs = updatedAuditConfig?.auditTypeConfigs || {};
    
        auditTypes.forEach(auditType => {
            updatedAuditConfig.auditTypeConfigs[auditType] = { disabled: !enable }; // Enable or disable the specific audit type
        });
    
        return updatedAuditConfig;
    }
    
    async configureAuditsForOrganization({organization, auditTypes = [], enable = true}) {
        try {
            organization.config.audits = SpaceCatSdk.updateAuditsConfig({auditConfig: organization?.config?.audits, auditTypes, enable});
    
            const responseData = await this.callApi({
                url: `${this.config.apiBaseUrl}/organizations/${organization.id}`,
                method: 'PATCH',
                body: { config: organization.config }
            });
    
            this.log.info(`Audit types '${auditTypes.join(', ')}' ${enable ? 'enabled' : 'disabled'} successfully at organization level for organization ${organization.id}`);
    
            return {
                id: responseData?.id,
                config: responseData?.config
            }
        } catch (error) {
            this.log.error('Error:', error.message);
            return null;
        }
    }
    
    async configureAuditsForSite({site, auditTypes = [], enable = true}) {
        try {
            site.auditConfig = SpaceCatSdk.updateAuditsConfig({auditConfig: site?.auditConfig, auditTypes, enable});
    
            const responseData = await this.callApi({
                url: `${this.config.apiBaseUrl}/sites/${site.id}`,
                method: 'PATCH',
                body: { auditConfig: site.auditConfig }
            });
    
            this.log.info(`Audit types '${auditTypes.join(', ')}' ${enable ? 'enabled' : 'disabled'} successfully at site level for site ${site.id}`);
    
            return {
                id: responseData?.id,
                auditConfig: responseData?.auditConfig,
                config: responseData?.config,
            };
        } catch (error) {
            this.log.error('Error:', error.message);
            return null;
        }
    }
    
    static updateReportsConfig({config, auditTypes = [], byOrg, channelId, userIds}) {
        const mentions = userIds ? [{ slack: userIds.map(userId => (`<@${userId}>`))}] : [];
    
        const updatedConfig = { ...config };
        updatedConfig.alerts = updatedConfig?.alerts || [];
        if (channelId) {
            updatedConfig.slack = { channel: updatedConfig?.slack?.channel || channelId };
        }
    
        auditTypes.forEach(auditType => {
            const existingAlertIndex = updatedConfig.alerts.findIndex((alert) => alert.type === auditType);
    
            if (existingAlertIndex !== -1) {
                updatedConfig.alerts[existingAlertIndex].byOrg = byOrg;
                updatedConfig.alerts[existingAlertIndex].mentions = updatedConfig.alerts[existingAlertIndex].mentions || mentions;
            } else {
                updatedConfig.alerts.push({
                    type: auditType,
                    byOrg,
                    mentions,
                });
            }
        });
    
        return updatedConfig;
    };
    
    async enableReportsAtOrganizationLevel({organization, auditTypes, channelId, userIds, byOrg = true}) {
        try {
            const updatedConfig = SpaceCatSdk.updateReportsConfig({config: organization?.config, auditTypes, byOrg, channelId, userIds});
    
            const responseData = await this.callApi({
                url: `${this.config.apiBaseUrl}/organizations/${organization.id}`,
                method: 'PATCH',
                body: {
                    config: updatedConfig,
                }
            });
            
            this.log.info(`Reporting for audit types '${auditTypes.join(', ')}' configured byOrg ${byOrg} successfully at organization level for organization ${organization.id}`);
    
            return {
                id: responseData?.id,
                config: responseData?.config,
                slack: responseData?.slack,
            };
        } catch (error) {
            this.log.error('Error:', error.message);
            return null;
        }
    }
    
    async enableReportsAtSiteLevel({site, auditTypes, channelId, userIds, byOrg}) {
        try {
            const updatedConfig = SpaceCatSdk.updateReportsConfig({config: site?.config, auditTypes, byOrg, channelId, userIds});
    
            const responseData = await this.callApi({
                url: `${this.config.apiBaseUrl}/sites/${site.id}`,
                method: 'PATCH',
                body: {
                    config: updatedConfig,
                }
            });
    
            this.log.info(`Reporting for audit types '${auditTypes.join(', ')}' configured byOrg ${byOrg} successfully at site level for site ${site.id}`);
    
            return {
                id: responseData?.id,
                config: responseData?.config,
                slack: responseData?.slack,
            };
        } catch (error) {
            this.log.error('Error:', error.message);
            return null;
        }
    }
}