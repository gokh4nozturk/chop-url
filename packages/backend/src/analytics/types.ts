export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface EventData {
  urlId: number;
  userId?: number;
  eventType: string;
  eventName: string;
  properties?: Record<string, unknown>;
  deviceInfo?: {
    userAgent: string;
    ip: string;
    device: string;
    browser: string;
    os: string;
  };
  geoInfo?: {
    country: string;
    city: string;
    region: string;
    timezone: string;
    latitude?: number;
    longitude?: number;
  };
  referrer?: string;
}

export interface CustomEventData {
  userId: number;
  name: string;
  description?: string;
  properties: string[];
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

export interface GeoStats {
  countries: Record<string, number>;
  cities: Record<string, number>;
  regions: Record<string, number>;
  timezones: Record<string, number>;
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
