import { z } from '@hono/zod-openapi';

// Domain schemas
export const addDomainSchema = z
  .object({
    domain: z.string().min(1),
    settings: z
      .object({
        redirectMode: z.enum(['PROXY', 'REDIRECT']).optional(),
        customNameservers: z.string().nullable().optional(),
        forceSSL: z.boolean().optional(),
      })
      .optional(),
  })
  .openapi('AddDomainSchema');

export const updateDomainSchema = z
  .object({
    domain: z.string().optional(),
    verificationMethod: z.enum(['DNS_TXT', 'DNS_CNAME', 'FILE']).optional(),
    isActive: z.boolean().optional(),
  })
  .openapi('UpdateDomainSchema');

export const addDnsRecordSchema = z
  .object({
    type: z.enum(['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS']),
    name: z.string().min(1),
    content: z.string().min(1),
    ttl: z.number().optional(),
    priority: z.number().optional(),
    proxied: z.boolean().optional(),
  })
  .openapi('AddDnsRecordSchema');

export const domainResponseSchema = z
  .object({
    id: z.number(),
    userId: z.number(),
    domain: z.string(),
    isVerified: z.boolean(),
    isActive: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
    settings: z
      .object({
        redirectMode: z.enum(['PROXY', 'REDIRECT']).optional(),
        customNameservers: z.string().nullable().optional(),
        forceSSL: z.boolean().optional(),
      })
      .optional(),
  })
  .openapi('DomainResponseSchema');

export const domainsResponseSchema = z
  .array(domainResponseSchema)
  .openapi('DomainsResponseSchema');

export const dnsRecordResponseSchema = z
  .object({
    id: z.string(),
    type: z.string(),
    name: z.string(),
    content: z.string(),
    ttl: z.number().optional(),
    priority: z.number().optional(),
    proxied: z.boolean().optional(),
  })
  .openapi('DnsRecordResponseSchema');

export const dnsRecordsResponseSchema = z
  .array(dnsRecordResponseSchema)
  .openapi('DnsRecordsResponseSchema');

export const successResponseSchema = z
  .object({
    message: z.string(),
  })
  .openapi('SuccessResponseSchema');

export const verifyResponseSchema = z
  .object({
    verified: z.boolean(),
  })
  .openapi('VerifyResponseSchema');

export const sslStatusResponseSchema = z
  .object({
    status: z.string(),
  })
  .openapi('SslStatusResponseSchema');

export const healthResponseSchema = z
  .object({
    status: z.string(),
    details: z.record(z.any()).optional(),
  })
  .openapi('HealthResponseSchema');
