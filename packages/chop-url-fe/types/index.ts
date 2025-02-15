export type TimeRange = '24h' | '7d' | '30d' | '90d';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

export interface Event {
  id: number;
  urlId: number;
  userId?: number;
  eventType: 'PAGE_VIEW' | 'CLICK' | 'CONVERSION' | 'CUSTOM' | 'REDIRECT';
  eventName: string;
  properties?: string;
  deviceInfo?: string;
  geoInfo?: string;
  referrer?: string;
  createdAt: string;
}
