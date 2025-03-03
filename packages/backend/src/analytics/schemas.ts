import { z } from '@hono/zod-openapi';

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
};
