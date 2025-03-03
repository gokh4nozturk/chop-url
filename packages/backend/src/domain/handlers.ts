import { D1Database } from '@cloudflare/workers-types';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { Context } from 'hono';
import { Database } from '../db/client';
import { handleError } from '../utils/error';
import { DomainService } from './service';

// Domain handlers
export const domainHandlers = {
  // Get all domains for user
  getDomains: async (c: Context) => {
    try {
      const user = c.get('user');

      if (!user || !user.id) {
        return c.json({ error: 'User not found' }, 401);
      }

      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domains = await domainService.getUserDomains(user.id);
      return c.json(domains);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Get a specific domain
  getDomainById: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      const domain = await domainService.getDomainWithSettings(
        domainId,
        user.id
      );
      if (!domain) {
        return c.json({ error: 'Domain not found' }, 404);
      }

      return c.json(domain);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Add a new domain
  addDomain: async (c: Context) => {
    try {
      const user = c.get('user');

      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const body = await c.req.json();
      const { domain, settings } = body;

      const result = await domainService.addDomain(user.id, domain, settings);
      return c.json(result, 201);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Update a domain
  updateDomain: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const body = await c.req.json();
      const updates = body;

      const domain = await domainService.updateDomain(
        domainId,
        user.id,
        updates
      );
      if (!domain) {
        return c.json({ error: 'Domain not found' }, 404);
      }

      return c.json(domain);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Delete a domain
  deleteDomain: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      await domainService.deleteDomain(domainId, user.id);
      return c.json({ message: 'Domain deleted successfully' });
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Verify domain ownership
  verifyDomain: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      const isVerified = await domainService.verifyDomain(domainId, user.id);
      return c.json({ verified: isVerified });
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Add DNS record
  addDnsRecord: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const body = await c.req.json();
      const record = body;

      const result = await domainService.addDnsRecord(
        domainId,
        user.id,
        record
      );
      return c.json(result, 201);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Get DNS records
  getDnsRecords: async (c: Context) => {
    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      const records = await domainService.getDnsRecords(domainId, user.id);
      return c.json(records);
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Get SSL status
  getSslStatus: async (c: Context) => {
    const domainId = parseInt(c.req.param('id'));
    const user = c.get('user');

    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const status = await domainService.checkAndUpdateSslStatus(
        domainId,
        user.id
      );
      return c.json({ status });
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Renew SSL certificate
  renewSsl: async (c: Context) => {
    const domainId = parseInt(c.req.param('id'));
    const user = c.get('user');

    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      await domainService.renewSslCertificate(domainId, user.id);
      return c.json({ message: 'SSL certificate renewal initiated' });
    } catch (error) {
      return handleError(c, error);
    }
  },

  // Check domain health
  getDomainHealth: async (c: Context) => {
    const domainId = parseInt(c.req.param('id'));
    const user = c.get('user');

    try {
      const db = c.get('db') as unknown as DrizzleD1Database<
        Record<string, unknown>
      > & {
        $client: D1Database;
      };

      const domainService = new DomainService(db, {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const health = await domainService.checkDomainHealth(domainId, user.id);
      return c.json(health);
    } catch (error) {
      return handleError(c, error);
    }
  },
};
