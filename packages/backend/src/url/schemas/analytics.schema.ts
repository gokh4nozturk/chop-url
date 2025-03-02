import { z } from '@hono/zod-openapi';

export const urlStatsSchema = z
  .object({
    totalClicks: z.number(),
    uniqueVisitors: z.number(),
    countries: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    cities: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    regions: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    timezones: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    referrers: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    devices: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    browsers: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    operatingSystems: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    clicksByDate: z.array(
      z.object({
        date: z.string(),
        count: z.number(),
      })
    ),
  })
  .openapi('UrlStatsResponse');

export const analyticsResponseSchema = z
  .object({
    totalClicks: z.number(),
    uniqueVisitors: z.number(),
    countries: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    cities: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    regions: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    timezones: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    referrers: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    devices: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    browsers: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    operatingSystems: z.array(
      z.object({
        name: z.string(),
        count: z.number(),
      })
    ),
    clicksByDate: z.array(
      z.object({
        date: z.string(),
        count: z.number(),
      })
    ),
  })
  .openapi('AnalyticsResponse');
