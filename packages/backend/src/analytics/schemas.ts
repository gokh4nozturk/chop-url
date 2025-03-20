import { z } from '@hono/zod-openapi';
import { ErrorCode } from '../utils/error';

// Time range schema
export const timeRangeSchema = z.enum(['24h', '7d', '30d', '90d']);

// Event tracking schemas
export const trackEventSchema = z
  .object({
    urlId: z.number(),
    userId: z.number().optional(),
    eventType: z.enum([
      'REDIRECT',
      'PAGE_VIEW',
      'CLICK',
      'CONVERSION',
      'CUSTOM',
    ]),
    eventName: z.string(),
    properties: z
      .object({
        source: z.string().nullable(),
        medium: z.string().nullable(),
        campaign: z.string().nullable(),
        term: z.string().nullable(),
        content: z.string().nullable(),
        shortId: z.string(),
        originalUrl: z.string(),
      })
      .optional(),
    deviceInfo: z
      .object({
        userAgent: z.string(),
        ip: z.string(),
        browser: z.string(),
        browserVersion: z.string(),
        os: z.string(),
        osVersion: z.string(),
        deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']),
      })
      .optional(),
    geoInfo: z
      .object({
        country: z.string(),
        city: z.string(),
        region: z.string(),
        regionCode: z.string(),
        timezone: z.string(),
        longitude: z.string(),
        latitude: z.string(),
        postalCode: z.string(),
      })
      .optional(),
    referrer: z.string().optional(),
  })
  .openapi('TrackEventSchema');

export const createCustomEventSchema = z
  .object({
    userId: z.number(),
    name: z.string(),
    description: z.string().optional(),
    properties: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi('CreateCustomEventSchema');

// Response schemas
export const successResponseSchema = z
  .object({
    success: z.boolean(),
  })
  .openapi('SuccessResponse');

export const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi('ErrorResponse');

// Analytics response schemas
export const urlStatsResponseSchema = z
  .object({
    totalEvents: z.number(),
    uniqueVisitors: z.number(),
    lastEventAt: z.string().nullable(),
    url: z.object({
      id: z.number(),
      shortId: z.string(),
      originalUrl: z.string(),
      createdAt: z.string(),
    }),
  })
  .openapi('UrlStatsResponse');

export const eventsResponseSchema = z.array(z.any()).openapi('EventsResponse');
export const customEventsResponseSchema = z
  .array(z.any())
  .openapi('CustomEventsResponse');
export const urlEventsResponseSchema = z
  .array(z.any())
  .openapi('UrlEventsResponse');

export const geoStatsResponseSchema = z
  .object({
    countries: z.record(z.string(), z.number()),
    cities: z.record(z.string(), z.number()),
    regions: z.record(z.string(), z.number()),
    timezones: z.record(z.string(), z.number()),
  })
  .openapi('GeoStatsResponse');

export const deviceStatsResponseSchema = z
  .object({
    browsers: z.record(z.string(), z.number()),
    devices: z.record(z.string(), z.number()),
    operatingSystems: z.record(z.string(), z.number()),
  })
  .openapi('DeviceStatsResponse');

export const utmStatsResponseSchema = z
  .object({
    sources: z.record(z.string(), z.number()),
    mediums: z.record(z.string(), z.number()),
    campaigns: z.record(z.string(), z.number()),
  })
  .openapi('UtmStatsResponse');

export const clickHistoryResponseSchema = z
  .array(
    z.object({
      name: z.string(),
      value: z.number(),
    })
  )
  .openapi('ClickHistoryResponse');

export const userAnalyticsResponseSchema = z
  .any()
  .openapi('UserAnalyticsResponse');

// Analytics-specific error schemas
export const analyticsValidationErrorSchema = z
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
        description: 'Validation error details',
        example: [
          {
            code: 'invalid_enum_value',
            message: 'Invalid time range. Expected one of: 24h, 7d, 30d, 90d',
            path: ['timeRange'],
          },
        ],
      }),
  })
  .openapi('AnalyticsValidationErrorSchema');

export const analyticsUrlNotFoundErrorSchema = z
  .object({
    code: z.literal(ErrorCode.URL_NOT_FOUND).openapi({
      example: ErrorCode.URL_NOT_FOUND,
      description: 'URL not found error code',
    }),
    message: z.string().openapi({
      example: 'URL not found. Cannot retrieve analytics data.',
      description: 'Error message',
    }),
  })
  .openapi('AnalyticsUrlNotFoundErrorSchema');

export const analyticsDataErrorSchema = z
  .object({
    code: z.literal(ErrorCode.INTERNAL_SERVER_ERROR).openapi({
      example: ErrorCode.INTERNAL_SERVER_ERROR,
      description: 'Analytics data error code',
    }),
    message: z.string().openapi({
      example: 'Failed to retrieve analytics data',
      description: 'Error message',
    }),
  })
  .openapi('AnalyticsDataErrorSchema');

export const customEventValidationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid custom event data',
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
            message: 'Required',
            path: ['name'],
          },
        ],
      }),
  })
  .openapi('CustomEventValidationErrorSchema');

// Schema collections
export const analyticsSchemas = {
  timeRange: timeRangeSchema,
  trackEvent: trackEventSchema,
  createCustomEvent: createCustomEventSchema,
  success: successResponseSchema,
  error: errorResponseSchema,
  urlStats: urlStatsResponseSchema,
  events: eventsResponseSchema,
  customEvents: customEventsResponseSchema,
  urlEvents: urlEventsResponseSchema,
  geoStats: geoStatsResponseSchema,
  deviceStats: deviceStatsResponseSchema,
  utmStats: utmStatsResponseSchema,
  clickHistory: clickHistoryResponseSchema,
  userAnalytics: userAnalyticsResponseSchema,
  // Error schemas
  validationError: analyticsValidationErrorSchema,
  urlNotFoundError: analyticsUrlNotFoundErrorSchema,
  dataError: analyticsDataErrorSchema,
  customEventValidationError: customEventValidationErrorSchema,
};
