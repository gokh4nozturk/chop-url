import { Env } from 'hono';
import { Variables } from 'hono/types';

export interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
  tags?: string[];
  groupId?: number;
}

export type H = { Bindings: Env; Variables: Variables };

export interface UpdateUrlOptions {
  originalUrl?: string;
  customSlug?: string;
  expiresAt?: string;
  tags?: string[];
  groupId?: number;
  isActive?: boolean;
}

export interface IUrlGroup {
  id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ICreateUrlResponse {
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  createdAt: string;
  userId: number | null;
  expiresAt?: string;
  tags?: string[];
  groupId?: number;
}

export interface IUrl {
  id: number;
  shortId: string;
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  lastAccessedAt?: string;
  visitCount: number;
  isActive: boolean;
  expiresAt?: string;
  userId?: number;
  customSlug?: string;
  tags?: string[];
  groupId?: number;
}

export interface IUrlStats {
  id: number;
  shortId: string;
  shortUrl: string;
  originalUrl: string;
  created: string | null;
  lastAccessed: string | null;
  visitCount: number;
  totalVisits: number;
  isActive: boolean;
  expiresAt: string | null;
  userId: number | null;
  customSlug: string | null;
  visits: IVisit[];
}

export interface IVisit {
  id: number;
  urlId: number;
  visitedAt: string;
  ipAddress: string;
  userAgent: string;
  referrer: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: string;
  country: string;
  city: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}
