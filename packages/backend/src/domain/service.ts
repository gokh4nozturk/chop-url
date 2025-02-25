import { D1Database } from '@cloudflare/workers-types';
import { and, eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import {
  Domain,
  DomainDnsRecord,
  DomainSettings,
  NewDomain,
  NewDomainDnsRecord,
  NewDomainSettings,
  domainDnsRecords,
  domainSettings,
  domains,
} from '../db/schema/domains';
import { CloudflareService } from './cloudflare.js';

interface DomainServiceConfig {
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  cloudflareZoneId: string;
}

export class DomainService {
  private cloudflare: CloudflareService;

  constructor(
    private readonly database: DrizzleD1Database<Record<string, unknown>> & {
      $client: D1Database;
    },
    private readonly config: DomainServiceConfig
  ) {
    this.cloudflare = new CloudflareService(
      config.cloudflareApiToken,
      config.cloudflareAccountId,
      config.cloudflareZoneId
    );
  }

  async addDomain(
    userId: number,
    domain: string,
    settings?: Partial<NewDomainSettings>
  ): Promise<Domain> {
    // Validate domain format
    if (!this.isValidDomain(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain already exists
    const existingDomain = await this.database
      .select()
      .from(domains)
      .where(eq(domains.domain, domain))
      .get();

    if (existingDomain) {
      throw new Error('Domain already exists');
    }

    // Generate verification token
    const verificationToken = this.generateVerificationToken();

    // Create domain record
    const newDomain: NewDomain = {
      userId,
      domain,
      verificationToken,
      verificationMethod: 'DNS_TXT',
      sslStatus: 'PENDING',
      isActive: false,
      isVerified: false,
    };

    const result = await this.database
      .insert(domains)
      .values(newDomain)
      .returning()
      .get();

    // Create default settings
    const defaultSettings: NewDomainSettings = {
      domainId: result.id,
      redirectMode: 'PROXY',
      forceSSL: true,
      ...settings,
    };

    await this.database.insert(domainSettings).values(defaultSettings);

    return result;
  }

  async verifyDomain(domainId: number, userId: number): Promise<boolean> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    let isVerified = false;

    switch (domain.verificationMethod) {
      case 'DNS_TXT':
        isVerified = await this.verifyDnsTxtRecord(domain);
        break;
      case 'DNS_CNAME':
        isVerified = await this.verifyDnsCnameRecord(domain);
        break;
      case 'FILE':
        isVerified = await this.verifyFileRecord(domain);
        break;
      default:
        throw new Error('Invalid verification method');
    }

    if (isVerified) {
      await this.database
        .update(domains)
        .set({ isVerified: true })
        .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
        .run();

      // Initialize SSL certificate
      await this.initializeSSL(domain);
    }

    return isVerified;
  }

  async getDomain(
    domainId: number,
    userId: number
  ): Promise<Domain | undefined> {
    return this.database
      .select()
      .from(domains)
      .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
      .get();
  }

  async getDomainWithSettings(
    domainId: number,
    userId: number
  ): Promise<(Domain & { settings: DomainSettings }) | undefined> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) return undefined;

    const settings = await this.database
      .select()
      .from(domainSettings)
      .where(eq(domainSettings.domainId, domainId))
      .get();

    if (!settings) return undefined;

    return { ...domain, settings };
  }

  async getUserDomains(userId: number): Promise<Domain[]> {
    try {
      console.log('Getting domains for user:', userId);

      if (!this.database) {
        console.error('Database instance is null');
        throw new Error('Database connection error');
      }

      const userDomains = await this.database
        .select()
        .from(domains)
        .where(eq(domains.userId, userId))
        .all();

      console.log('Retrieved domains:', {
        count: userDomains.length,
        domains: userDomains,
      });

      return userDomains;
    } catch (error) {
      console.error('Error in getUserDomains:', {
        userId,
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  async updateDomain(
    domainId: number,
    userId: number,
    updates: Partial<Domain>
  ): Promise<Domain | undefined> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) return undefined;

    return this.database
      .update(domains)
      .set(updates)
      .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
      .returning()
      .get();
  }

  async deleteDomain(domainId: number, userId: number): Promise<void> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) return;

    await this.database
      .delete(domains)
      .where(and(eq(domains.id, domainId), eq(domains.userId, userId)))
      .run();
  }

  async addDnsRecord(
    domainId: number,
    userId: number,
    record: Omit<NewDomainDnsRecord, 'domainId'>
  ): Promise<DomainDnsRecord> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const newRecord: NewDomainDnsRecord = {
      ...record,
      domainId,
    };

    return this.database
      .insert(domainDnsRecords)
      .values(newRecord)
      .returning()
      .get();
  }

  async getDnsRecords(
    domainId: number,
    userId: number
  ): Promise<DomainDnsRecord[]> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    return this.database
      .select()
      .from(domainDnsRecords)
      .where(eq(domainDnsRecords.domainId, domainId))
      .all();
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(domain);
  }

  private generateVerificationToken(): string {
    return `chop-verify-${crypto.randomUUID()}`;
  }

  private async verifyDnsTxtRecord(domain: Domain): Promise<boolean> {
    try {
      const records = await this.cloudflare.getDnsTxtRecords(domain.domain);
      return records.some(
        (record) => record.content === domain.verificationToken
      );
    } catch (error) {
      console.error('Error verifying DNS TXT record:', error);
      return false;
    }
  }

  private async verifyDnsCnameRecord(domain: Domain): Promise<boolean> {
    try {
      const records = await this.cloudflare.getDnsCnameRecords(domain.domain);
      return records.some((record) => record.content === 'verify.chop-url.com');
    } catch (error) {
      console.error('Error verifying DNS CNAME record:', error);
      return false;
    }
  }

  private async verifyFileRecord(domain: Domain): Promise<boolean> {
    try {
      const response = await fetch(
        `https://${domain.domain}/.well-known/chop-verify.txt`
      );
      const content = await response.text();
      return content.trim() === domain.verificationToken;
    } catch (error) {
      console.error('Error verifying file record:', error);
      return false;
    }
  }

  async checkAndUpdateSslStatus(
    domainId: number,
    userId: number
  ): Promise<string> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    try {
      const cloudflareStatus = await this.cloudflare.getSslStatus(
        domain.domain
      );
      const sslStatus = this.mapCloudflareStatusToInternal(cloudflareStatus);
      await this.updateDomain(domainId, userId, { sslStatus });
      return sslStatus;
    } catch (error) {
      console.error('Error checking SSL status:', error);
      throw new Error('Failed to check SSL status');
    }
  }

  private mapCloudflareStatusToInternal(
    status: string
  ): 'PENDING' | 'ACTIVE' | 'FAILED' | 'EXPIRED' | 'INITIALIZING' {
    switch (status.toLowerCase()) {
      case 'active':
        return 'ACTIVE';
      case 'pending_validation':
      case 'pending_issuance':
        return 'PENDING';
      case 'expired':
        return 'EXPIRED';
      case 'initializing':
        return 'INITIALIZING';
      default:
        return 'FAILED';
    }
  }

  async renewSslCertificate(domainId: number, userId: number): Promise<void> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    try {
      await this.cloudflare.requestSslCertificate(domain.domain);
      await this.updateDomain(domainId, userId, {
        sslStatus: 'PENDING' as const,
        lastHealthCheck: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error renewing SSL certificate:', error);
      throw new Error('Failed to renew SSL certificate');
    }
  }

  async checkDomainHealth(
    domainId: number,
    userId: number
  ): Promise<{
    dnsStatus: boolean;
    sslStatus: string;
    isHealthy: boolean;
    lastChecked: string;
    metrics: {
      sslDetails: {
        validFrom?: string;
        validTo?: string;
        issuer?: string;
        autoRenewal: boolean;
        daysUntilExpiry?: number;
      };
      performance: {
        responseTime: number;
        uptime: number;
        lastDowntime?: string;
      };
      security: {
        sslGrade?: string;
        hsts: boolean;
        securityHeaders: boolean;
      };
    };
    issues: Array<{
      type: 'dns' | 'ssl' | 'response' | 'security';
      severity: 'warning' | 'error';
      message: string;
      recommendation?: string;
    }>;
  }> {
    const domain = await this.getDomain(domainId, userId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    try {
      // Check DNS records
      const txtRecords = await this.cloudflare.getDnsTxtRecords(domain.domain);
      const cnameRecords = await this.cloudflare.getDnsCnameRecords(
        domain.domain
      );
      const dnsStatus = txtRecords.length > 0 || cnameRecords.length > 0;

      // Check SSL status and details
      const sslDetails = await this.cloudflare.getDetailedSslStatus(
        domain.domain
      );
      const sslStatus = this.mapCloudflareStatusToInternal(sslDetails.status);

      // Performance check
      const performanceMetrics = await this.checkPerformance(domain.domain);

      // Security check
      const securityMetrics = await this.checkSecurity(domain.domain);

      const now = new Date().toISOString();

      // Collect issues
      const issues: Array<{
        type: 'dns' | 'ssl' | 'response' | 'security';
        severity: 'warning' | 'error';
        message: string;
        recommendation?: string;
      }> = [];

      // DNS issues
      if (!dnsStatus) {
        issues.push({
          type: 'dns',
          severity: 'error',
          message: 'DNS records are not properly configured',
          recommendation:
            'Please verify your DNS configuration and add required records',
        });
      }

      // SSL issues
      if (sslStatus !== 'ACTIVE') {
        issues.push({
          type: 'ssl',
          severity: 'error',
          message: 'SSL certificate is not active',
          recommendation:
            'Request a new SSL certificate or check the configuration',
        });
      } else if (
        sslDetails.daysUntilExpiry &&
        sslDetails.daysUntilExpiry < 30
      ) {
        issues.push({
          type: 'ssl',
          severity: 'warning',
          message: `SSL certificate will expire in ${sslDetails.daysUntilExpiry} days`,
          recommendation: 'Consider renewing the SSL certificate',
        });
      }

      // Performance issues
      if (performanceMetrics.responseTime > 1000) {
        issues.push({
          type: 'response',
          severity: 'warning',
          message: 'High response time detected',
          recommendation: 'Consider optimizing your server configuration',
        });
      }

      // Security issues
      if (!securityMetrics.hsts) {
        issues.push({
          type: 'security',
          severity: 'warning',
          message: 'HSTS is not enabled',
          recommendation: 'Enable HSTS for improved security',
        });
      }

      // Update domain status
      await this.updateDomain(domainId, userId, {
        isActive: dnsStatus,
        sslStatus,
        lastHealthCheck: now,
      });

      return {
        dnsStatus,
        sslStatus,
        isHealthy: dnsStatus && sslStatus === 'ACTIVE' && issues.length === 0,
        lastChecked: now,
        metrics: {
          sslDetails: {
            validFrom: sslDetails.validFrom,
            validTo: sslDetails.validTo,
            issuer: sslDetails.issuer,
            autoRenewal: sslDetails.autoRenewal,
            daysUntilExpiry: sslDetails.daysUntilExpiry,
          },
          performance: performanceMetrics,
          security: securityMetrics,
        },
        issues,
      };
    } catch (error) {
      console.error('Error checking domain health:', error);
      throw new Error('Failed to check domain health');
    }
  }

  private async checkPerformance(domain: string): Promise<{
    responseTime: number;
    uptime: number;
    lastDowntime?: string;
  }> {
    try {
      const startTime = Date.now();
      await fetch(`https://${domain}`);
      const responseTime = Date.now() - startTime;

      // TODO: Implement actual uptime tracking
      return {
        responseTime,
        uptime: 99.9, // Placeholder
      };
    } catch (error) {
      return {
        responseTime: -1,
        uptime: 0,
        lastDowntime: new Date().toISOString(),
      };
    }
  }

  private async checkSecurity(domain: string): Promise<{
    sslGrade?: string;
    hsts: boolean;
    securityHeaders: boolean;
  }> {
    try {
      const response = await fetch(`https://${domain}`);
      const headers = response.headers;

      return {
        sslGrade: 'A', // Placeholder - implement actual SSL grade check
        hsts: headers.get('Strict-Transport-Security') !== null,
        securityHeaders: this.checkSecurityHeaders(headers),
      };
    } catch (error) {
      return {
        hsts: false,
        securityHeaders: false,
      };
    }
  }

  private checkSecurityHeaders(headers: Headers): boolean {
    const securityHeaders = [
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Content-Security-Policy',
    ];

    return securityHeaders.some((header) => headers.get(header) !== null);
  }

  private async initializeSSL(domain: Domain): Promise<void> {
    try {
      // Configure SSL settings
      await this.cloudflare.configureSsl('full');
      await this.cloudflare.enableAlwaysUseHttps(domain.domain);

      // Request SSL certificate
      await this.cloudflare.requestSslCertificate(domain.domain);

      // Update domain status
      await this.updateDomain(domain.id, domain.userId, {
        sslStatus: 'INITIALIZING' as const,
        lastHealthCheck: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error initializing SSL:', error);
      throw new Error('Failed to initialize SSL');
    }
  }
}
