import { Context, Hono } from 'hono';
import { z } from 'zod';
import { auth } from '../auth/middleware';
import { DomainService } from './service';

const addDomainSchema = z.object({
  domain: z.string().min(1),
  settings: z
    .object({
      redirectMode: z.enum(['PROXY', 'REDIRECT']).optional(),
      customNameservers: z.string().optional(),
      forceSSL: z.boolean().optional(),
    })
    .optional(),
});

const updateDomainSchema = z.object({
  domain: z.string().optional(),
  verificationMethod: z.enum(['DNS_TXT', 'DNS_CNAME', 'FILE']).optional(),
  isActive: z.boolean().optional(),
});

const addDnsRecordSchema = z.object({
  type: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS']),
  name: z.string().min(1),
  content: z.string().min(1),
  ttl: z.number().optional(),
  priority: z.number().optional(),
  proxied: z.boolean().optional(),
});

interface Env {
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID: string;
}

export const createDomainRoutes = () => {
  const router = new Hono<{ Bindings: Env }>();

  // Add a new domain
  router.post('/domains', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const body = await c.req.json();
      const { domain, settings } = addDomainSchema.parse(body);
      const user = c.get('user');

      const result = await domainService.addDomain(user.id, domain, settings);
      return c.json(result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: 'Invalid request body' }, 400);
      }
      if (error instanceof Error) {
        if (error.message === 'Domain already exists') {
          return c.json({ error: 'Domain already exists' }, 409);
        }
        if (error.message === 'Invalid domain format') {
          return c.json({ error: 'Invalid domain format' }, 400);
        }
      }
      return c.json({ error: 'Failed to add domain' }, 500);
    }
  });

  // Get all domains for user
  router.get('/domains', auth(), async (c: Context) => {
    try {
      console.log('Handling GET /domains request');

      const user = c.get('user');
      console.log('User from context:', user);

      if (!user || !user.id) {
        console.error('No user or user ID in context');
        return c.json({ error: 'User not found' }, 401);
      }

      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domains = await domainService.getUserDomains(user.id);
      console.log('Successfully retrieved domains:', { count: domains.length });

      return c.json(domains);
    } catch (error) {
      console.error('Error in GET /domains:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        user: c.get('user'),
      });

      if (error instanceof Error) {
        return c.json({ error: error.message }, 500);
      }
      return c.json({ error: 'Failed to get domains' }, 500);
    }
  });

  // Get a specific domain
  router.get('/domains/:id', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
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
      return c.json({ error: 'Failed to get domain' }, 500);
    }
  });

  // Update a domain
  router.patch('/domains/:id', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const body = await c.req.json();
      const updates = updateDomainSchema.parse(body);

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
      if (error instanceof z.ZodError) {
        return c.json({ error: 'Invalid request body' }, 400);
      }
      return c.json({ error: 'Failed to update domain' }, 500);
    }
  });

  // Delete a domain
  router.delete('/domains/:id', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      await domainService.deleteDomain(domainId, user.id);
      return c.json({ message: 'Domain deleted successfully' });
    } catch (error) {
      return c.json({ error: 'Failed to delete domain' }, 500);
    }
  });

  // Verify domain ownership
  router.post('/domains/:id/verify', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      const isVerified = await domainService.verifyDomain(domainId, user.id);
      return c.json({ verified: isVerified });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Domain not found') {
          return c.json({ error: 'Domain not found' }, 404);
        }
      }
      return c.json({ error: 'Failed to verify domain' }, 500);
    }
  });

  // Add DNS record
  router.post('/domains/:id/dns', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');
      const body = await c.req.json();
      const record = addDnsRecordSchema.parse(body);

      const result = await domainService.addDnsRecord(
        domainId,
        user.id,
        record
      );
      return c.json(result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ error: 'Invalid request body' }, 400);
      }
      if (error instanceof Error) {
        if (error.message === 'Domain not found') {
          return c.json({ error: 'Domain not found' }, 404);
        }
      }
      return c.json({ error: 'Failed to add DNS record' }, 500);
    }
  });

  // Get DNS records
  router.get('/domains/:id/dns', auth(), async (c: Context) => {
    try {
      const domainService = new DomainService(c.get('db'), {
        cloudflareApiToken: c.env.CLOUDFLARE_API_TOKEN,
        cloudflareAccountId: c.env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareZoneId: c.env.CLOUDFLARE_ZONE_ID,
      });

      const domainId = parseInt(c.req.param('id'));
      const user = c.get('user');

      const records = await domainService.getDnsRecords(domainId, user.id);
      return c.json(records);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Domain not found') {
          return c.json({ error: 'Domain not found' }, 404);
        }
      }
      return c.json({ error: 'Failed to get DNS records' }, 500);
    }
  });

  return router;
};
