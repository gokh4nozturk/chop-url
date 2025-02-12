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
  shortUrl: string;
  shortId: string;
  originalUrl: string;
  customSlug?: string;
  userId: number;
  createdAt: string;
  lastAccessedAt?: string;
  visitCount: number;
  expiresAt?: string;
  isActive: boolean;
}
