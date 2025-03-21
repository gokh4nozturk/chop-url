export interface User {
  id: number;
  email: string;
  name: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresAt: Date;
  requiresTwoFactor?: boolean;
}

export interface URLInfo {
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  createdAt: Date;
  visitCount: number;
  lastAccessedAt: Date | null;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface TokenData {
  token: string;
  expiresAt: Date;
}

export interface AuthState {
  user: User | null;
  tokenData: TokenData | null;
  isLoading: boolean;
  error: AuthError | null;
}

export interface IVisit {
  visitedAt: Date;
  ipAddress: string;
  userAgent: string;
  referrer: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  osVersion: string | null;
  deviceType: string | null;
  country: string | null;
  city: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
}

export interface IUrlStats {
  shortId: string;
  originalUrl: string;
  created: Date;
  lastAccessed: Date | null;
  visitCount: number;
  totalVisits: number;
  visits: IVisit[];
}

export interface IUrl {
  id: number;
  shortId: string;
  originalUrl: string;
  shortUrl: string;
  customSlug?: string;
  userId: number;
  groupId?: number;
  visitCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  expiresAt?: string;
  tags?: string[];
  // UTM Parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Expiration Config
  expirationEnabled?: boolean;
  expirationValue?: number;
  expirationUnit?: 'hours' | 'days' | 'weeks' | 'months';
}

export interface IUrlGroup {
  id: number;
  name: string;
  description?: string;
  userId: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUrlOptions {
  customSlug?: string;
  expiresAt?: string;
  tags?: string[];
  groupId?: number;
}

export interface UpdateUrlOptions {
  originalUrl: string;
  customSlug?: string;
  tags?: string[];
  groupId?: number;
  isActive: boolean;
  expiresAt?: string;
  // UTM Parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  // Expiration Config
  expirationEnabled?: boolean;
  expirationValue?: number;
  expirationUnit?: 'hours' | 'days' | 'weeks' | 'months';
}

export interface IUrlError {
  code: string;
  message: string;
}

export type SortOption = 'newest' | 'oldest' | 'most-visited' | 'least-visited';

export type Period = '24h' | '7d' | '30d' | '90d';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

export interface GeoInfo {
  country: string;
  city: string;
  region: string;
  regionCode: string;
  timezone: string;
  longitude: string;
  latitude: string;
  postalCode: string;
}

export interface EventProperties {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
  shortId: string;
  originalUrl: string;
}

export interface Event {
  id: number;
  urlId: number;
  userId?: number;
  eventType: 'REDIRECT' | 'PAGE_VIEW' | 'CLICK' | 'CONVERSION' | 'CUSTOM';
  eventName: string;
  properties: string | null; // JSON string of EventProperties
  deviceInfo: string | null; // JSON string of DeviceInfo
  geoInfo: string | null; // JSON string of GeoInfo
  referrer?: string;
  createdAt: string;
}

export interface GeoStats {
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
  timezones: Record<string, number>;
}

export interface UrlStats {
  totalEvents: number;
  uniqueVisitors: number;
  lastEventAt: string | null;
  url: {
    id: number;
    shortId: string;
    originalUrl: string;
    createdAt: string | null;
  };
}

export interface DeviceStats {
  browsers: Record<string, number>;
  devices: Record<string, number>;
  operatingSystems: Record<string, number>;
}

export interface UtmStats {
  sources: Record<string, number>;
  mediums: Record<string, number>;
  campaigns: Record<string, number>;
}

export interface ClickStats {
  name: string; // Date in YYYY-MM-DD format
  value: number; // Number of clicks
}
