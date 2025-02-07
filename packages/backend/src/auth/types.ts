/**
 * User interface
 */
export interface IUser {
  id: number;
  email: string;
  name: string;
  isEmailVerified: boolean;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Recovery code interface
 */
export interface IRecoveryCode {
  id: number;
  userId: number;
  code: string;
  isUsed: boolean;
  usedAt: Date | null;
  createdAt: Date;
}

/**
 * Session interface
 */
export interface ISession {
  id: number;
  userId: number;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Login credentials interface
 */
export interface ILoginCredentials {
  email: string;
  password: string;
}

/**
 * Register credentials interface
 */
export interface IRegisterCredentials extends ILoginCredentials {
  confirmPassword: string;
}

/**
 * Auth response interface
 */
export interface IAuthResponse {
  user: IUser;
  token: string;
  expiresAt: Date;
  requiresTwoFactor?: boolean;
}

/**
 * Auth attempt type
 */
export type AuthAttemptType = 'totp' | 'recovery' | 'password';

/**
 * Auth attempt interface
 */
export interface IAuthAttempt {
  id: number;
  userId: number;
  ipAddress: string;
  attemptType: AuthAttemptType;
  isSuccessful: boolean;
  createdAt: Date;
}

/**
 * Auth error codes
 */
export enum AuthErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  USER_EXISTS = 'USER_EXISTS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INVALID_2FA_CODE = 'INVALID_2FA_CODE',
  TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
}

/**
 * Custom error class for auth operations
 */
export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Database row interfaces
 */
export interface IUserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  is_email_verified: boolean;
  is_two_factor_enabled: boolean;
  two_factor_secret: string | null;
  created_at: string;
  updated_at: string;
}

export interface ISessionRow {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface IRecoveryCodeRow {
  id: number;
  user_id: number;
  code: string;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
}

export interface IAuthAttemptRow {
  id: number;
  user_id: number;
  ip_address: string;
  attempt_type: AuthAttemptType;
  is_successful: boolean;
  created_at: string;
}
