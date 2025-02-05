/**
 * User interface
 */
export interface IUser {
  id: number;
  email: string;
  createdAt: Date;
  updatedAt: Date;
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
  password_hash: string;
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
