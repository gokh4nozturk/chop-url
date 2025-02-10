export interface IUrl {
  id: number;
  shortId: string;
  shortUrl: string;
  originalUrl: string;
  created_at: string;
  last_accessed_at: string | null;
  visit_count: number;
  isActive: boolean;
  expiresAt: string | null;
  userId: number | null;
  customSlug: string | null;
}

export interface IVisit {
  id: number;
  urlId: number;
  visitedAt: string;
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
}

export interface IUrlStats extends IUrl {
  visits: IVisit[];
}

export interface ICreateUrlResponse {
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  createdAt: string | null;
}
