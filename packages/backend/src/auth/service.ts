import { D1Database } from '@cloudflare/workers-types';
import {
  AuthError,
  AuthErrorCode,
  IAuthResponse,
  ILoginCredentials,
  IRegisterCredentials,
  IUser,
  IUserRow,
} from './types';

export class AuthService {
  constructor(private db: D1Database) {}

  async register(credentials: IRegisterCredentials): Promise<IAuthResponse> {
    const { email, password, confirmPassword } = credentials;

    if (password !== confirmPassword) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Passwords do not match'
      );
    }

    // Check if user exists
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ?')
      .bind(email)
      .first<{ id: number }>();

    if (existingUser) {
      throw new AuthError(AuthErrorCode.USER_EXISTS, 'User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const result = await this.db
      .prepare(
        'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email, created_at, updated_at'
      )
      .bind(email, passwordHash)
      .first<IUserRow>();

    if (!result) {
      throw new AuthError(
        AuthErrorCode.DATABASE_ERROR,
        'Failed to create user'
      );
    }

    // Create session
    const { token, expiresAt } = await this.createSession(result.id);

    return {
      user: this.mapUserRow(result),
      token,
      expiresAt,
    };
  }

  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const { email, password } = credentials;

    // Get user
    const user = await this.db
      .prepare(
        'SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = ?'
      )
      .bind(email)
      .first<IUserRow>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials'
      );
    }

    // Create session
    const { token, expiresAt } = await this.createSession(user.id);

    return {
      user: this.mapUserRow(user),
      token,
      expiresAt,
    };
  }

  async verifyToken(token: string): Promise<IUser> {
    // Get session
    const session = await this.db
      .prepare(
        'SELECT user_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      )
      .bind(token)
      .first<{ user_id: number; expires_at: string }>();

    if (!session) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired token'
      );
    }

    // Get user
    const user = await this.db
      .prepare(
        'SELECT id, email, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(session.user_id)
      .first<IUserRow>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    return this.mapUserRow(user);
  }

  private mapUserRow(row: IUserRow): IUser {
    return {
      id: row.id,
      email: row.email,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private async createSession(
    userId: number
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.db
      .prepare(
        'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
      )
      .bind(userId, token, expiresAt.toISOString())
      .run();

    return { token, expiresAt };
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Buffer.from(hash).toString('hex');
  }

  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }
}
