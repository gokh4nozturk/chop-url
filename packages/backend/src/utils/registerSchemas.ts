import type { z } from '@hono/zod-openapi';
import type { ZodSchema } from 'zod';
import {
  analyticsDataErrorSchema,
  analyticsUrlNotFoundErrorSchema,
  analyticsValidationErrorSchema,
  customEventValidationErrorSchema,
} from '../analytics/schemas';

import {
  authValidationErrorSchema,
  expiredTokenErrorSchema,
  invalid2FACodeErrorSchema,
  invalidCredentialsErrorSchema,
  invalidTokenErrorSchema,
  tooManyAttemptsErrorSchema,
  userExistsErrorSchema,
  userNotFoundErrorSchema,
} from '../auth/schemas';

import {
  domainExistsErrorSchema,
  domainNotFoundErrorSchema,
  domainValidationErrorSchema,
  domainVerificationErrorSchema,
  invalidDomainErrorSchema,
} from '../domain/schemas';

import {
  urlEmailValidationErrorSchema,
  urlNotFoundErrorSchema,
  urlValidationErrorSchema,
} from '../url/schemas';

import {
  forbiddenErrorSchema,
  notFoundErrorSchema,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from './openapi';

import { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Register all custom error schemas in the application to the OpenAPI registry
 * This ensures endpoint-specific error schemas are properly documented
 */
export const registerCustomErrorSchemas = (registry: {
  registerComponent: (type: string, name: string, schema: ZodSchema) => void;
}): void => {
  // Register common error schemas
  registry.registerComponent(
    'schemas',
    'ValidationErrorSchema',
    validationErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'UnauthorizedErrorSchema',
    unauthorizedErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'ForbiddenErrorSchema',
    forbiddenErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'NotFoundErrorSchema',
    notFoundErrorSchema
  );

  // Register URL-specific error schemas
  registry.registerComponent(
    'schemas',
    'UrlValidationErrorSchema',
    urlValidationErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'UrlNotFoundErrorSchema',
    urlNotFoundErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'UrlEmailValidationErrorSchema',
    urlEmailValidationErrorSchema
  );

  // Register Auth-specific error schemas
  registry.registerComponent(
    'schemas',
    'InvalidCredentialsErrorSchema',
    invalidCredentialsErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'UserExistsErrorSchema',
    userExistsErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'UserNotFoundErrorSchema',
    userNotFoundErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'Invalid2FACodeErrorSchema',
    invalid2FACodeErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'InvalidTokenErrorSchema',
    invalidTokenErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'ExpiredTokenErrorSchema',
    expiredTokenErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'TooManyAttemptsErrorSchema',
    tooManyAttemptsErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'AuthValidationErrorSchema',
    authValidationErrorSchema
  );

  // Register Domain-specific error schemas
  registry.registerComponent(
    'schemas',
    'DomainNotFoundErrorSchema',
    domainNotFoundErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'DomainVerificationErrorSchema',
    domainVerificationErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'DomainExistsErrorSchema',
    domainExistsErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'InvalidDomainErrorSchema',
    invalidDomainErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'DomainValidationErrorSchema',
    domainValidationErrorSchema
  );

  // Register Analytics-specific error schemas
  registry.registerComponent(
    'schemas',
    'AnalyticsValidationErrorSchema',
    analyticsValidationErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'AnalyticsUrlNotFoundErrorSchema',
    analyticsUrlNotFoundErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'AnalyticsDataErrorSchema',
    analyticsDataErrorSchema
  );
  registry.registerComponent(
    'schemas',
    'CustomEventValidationErrorSchema',
    customEventValidationErrorSchema
  );
};
