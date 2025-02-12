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
  originalUrl?: string;
  customSlug?: string;
  expiresAt?: string;
  tags?: string[];
  groupId?: number;
  isActive?: boolean;
}

export interface IUrlError {
  code: string;
  message: string;
}

export type SortOption = 'newest' | 'oldest' | 'most-visited' | 'least-visited';

export type Period = '24h' | '7d' | '30d' | '90d';
