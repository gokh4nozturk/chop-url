import { withOpenAPI } from '@/utils/openapi';
import { OpenAPIHono } from '@hono/zod-openapi';
import { zValidator } from '@hono/zod-validator';
import { auth } from '../auth/middleware';
import { H } from '../types/hono.types';
import { RouteGroup } from '../types/route.types';
import { handleError } from '../utils/error';
import { createRouteGroup } from '../utils/route-factory';
import { domainHandlers } from './handlers';
import {
  addDnsRecordSchema,
  addDomainSchema,
  dnsRecordResponseSchema,
  dnsRecordsResponseSchema,
  domainResponseSchema,
  domainsResponseSchema,
  healthResponseSchema,
  sslStatusResponseSchema,
  successResponseSchema,
  updateDomainSchema,
  verifyResponseSchema,
} from './schemas';

// Domain route groups
const domainRoutes: RouteGroup[] = [
  {
    prefix: '/domains',
    tag: 'DOMAINS',
    description: 'Domain management endpoints',
    routes: [
      {
        path: '/list',
        method: 'get',
        description: 'Get all domains for the authenticated user',
        requiresAuth: true,
        schema: {
          response: domainsResponseSchema,
        },
        handler: domainHandlers.getDomains,
      },
      {
        path: '/create',
        method: 'post',
        description: 'Add a new domain',
        requiresAuth: true,
        schema: {
          request: addDomainSchema,
          response: domainResponseSchema,
        },
        handler: domainHandlers.addDomain,
      },
      {
        path: '/:id',
        method: 'get',
        description: 'Get a specific domain',
        requiresAuth: true,
        schema: {
          response: domainResponseSchema,
        },
        handler: domainHandlers.getDomainById,
      },
      {
        path: '/:id',
        method: 'patch',
        description: 'Update a domain',
        requiresAuth: true,
        schema: {
          request: updateDomainSchema,
          response: domainResponseSchema,
        },
        handler: domainHandlers.updateDomain,
      },
      {
        path: '/:id',
        method: 'delete',
        description: 'Delete a domain',
        requiresAuth: true,
        schema: {
          response: successResponseSchema,
        },
        handler: domainHandlers.deleteDomain,
      },
      {
        path: '/:id/verify',
        method: 'post',
        description: 'Verify domain ownership',
        requiresAuth: true,
        schema: {
          response: verifyResponseSchema,
        },
        handler: domainHandlers.verifyDomain,
      },
      {
        path: '/:id/dns',
        method: 'post',
        description: 'Add DNS record',
        requiresAuth: true,
        schema: {
          request: addDnsRecordSchema,
          response: dnsRecordResponseSchema,
        },
        handler: domainHandlers.addDnsRecord,
      },
      {
        path: '/:id/dns',
        method: 'get',
        description: 'Get DNS records',
        requiresAuth: true,
        schema: {
          response: dnsRecordsResponseSchema,
        },
        handler: domainHandlers.getDnsRecords,
      },
      {
        path: '/:id/ssl/status',
        method: 'get',
        description: 'Get SSL status',
        requiresAuth: true,
        schema: {
          response: sslStatusResponseSchema,
        },
        handler: domainHandlers.getSslStatus,
      },
      {
        path: '/:id/ssl/renew',
        method: 'post',
        description: 'Renew SSL certificate',
        requiresAuth: true,
        schema: {
          response: successResponseSchema,
        },
        handler: domainHandlers.renewSsl,
      },
      {
        path: '/:id/health',
        method: 'get',
        description: 'Check domain health',
        requiresAuth: true,
        schema: {
          response: healthResponseSchema,
        },
        handler: domainHandlers.getDomainHealth,
      },
    ],
  },
];

// Create base router
const createBaseDomainRoutes = () => {
  const router = new OpenAPIHono<H>();

  // Register all routes with middleware
  for (const route of domainRoutes.flatMap((group) =>
    createRouteGroup(group)
  )) {
    const middlewares = [];

    // Add authentication middleware if required
    if (route.metadata.requiresAuth) {
      middlewares.push(auth());
    }

    // Add validation middleware if schema exists
    if (route.schema?.request) {
      middlewares.push(zValidator('json', route.schema.request));
    }

    // Register route with error handling
    router[route.method](route.path, ...middlewares, async (c) => {
      try {
        return await route.handler(c);
      } catch (error) {
        return handleError(c, error);
      }
    });
  }

  return router;
};

export const createDomainRoutes = withOpenAPI(createBaseDomainRoutes, '/api');
