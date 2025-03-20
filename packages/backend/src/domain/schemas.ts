import { z } from '@hono/zod-openapi';
import { ErrorCode } from '../utils/error';

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

export const domainSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    userId: z.number(),
    verified: z.boolean(),
    verificationToken: z.string().optional(),
    recordType: z.enum(['TXT', 'CNAME']),
    recordValue: z.string(),
    recordName: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string().optional(),
    isDefault: z.boolean().optional(),
  })
  .openapi('DomainSchema');

export const createDomainSchema = z
  .object({
    name: z.string(),
    recordType: z.enum(['TXT', 'CNAME']).optional(),
  })
  .openapi('CreateDomainSchema');

export const domainResponseSchema = z
  .object({
    domain: domainSchema,
  })
  .openapi('DomainResponseSchema');

export const domainsResponseSchema = z
  .array(domainSchema)
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

export const verifyDomainSchema = z
  .object({
    id: z.number(),
  })
  .openapi('VerifyDomainSchema');

export const verificationStatusSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    verified: z.boolean(),
    recordType: z.enum(['TXT', 'CNAME']),
    recordName: z.string().optional(),
    recordValue: z.string(),
    message: z.string().optional(),
  })
  .openapi('VerificationStatusSchema');

// Domain-specific error schemas
export const domainNotFoundErrorSchema = z
  .object({
    code: z.literal(ErrorCode.RESOURCE_NOT_FOUND).openapi({
      example: ErrorCode.RESOURCE_NOT_FOUND,
      description: 'Domain not found error code',
    }),
    message: z.string().openapi({
      example: 'Domain not found.',
      description: 'Error message',
    }),
  })
  .openapi('DomainNotFoundErrorSchema');

export const domainVerificationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.BAD_REQUEST).openapi({
      example: ErrorCode.BAD_REQUEST,
      description: 'Domain verification error code',
    }),
    message: z.string().openapi({
      example:
        'Domain verification failed. DNS record not found or not propagated yet.',
      description: 'Error message with verification details',
    }),
  })
  .openapi('DomainVerificationErrorSchema');

export const domainExistsErrorSchema = z
  .object({
    code: z.literal(ErrorCode.BAD_REQUEST).openapi({
      example: ErrorCode.BAD_REQUEST,
      description: 'Domain already exists error code',
    }),
    message: z.string().openapi({
      example: 'Domain already exists.',
      description: 'Error message',
    }),
  })
  .openapi('DomainExistsErrorSchema');

export const invalidDomainErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Invalid domain error code',
    }),
    message: z.string().openapi({
      example: 'Invalid domain name format.',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.string()),
        })
      )
      .openapi({
        description: 'Validation error details',
        example: [
          {
            code: 'invalid_string',
            message: 'Invalid domain name format',
            path: ['name'],
          },
        ],
      }),
  })
  .openapi('InvalidDomainErrorSchema');

export const domainValidationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid request body',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.string()),
        })
      )
      .openapi({
        description: 'Domain validation error details',
        example: [
          {
            code: 'invalid_string',
            message: 'Required',
            path: ['name'],
          },
        ],
      }),
  })
  .openapi('DomainValidationErrorSchema');
