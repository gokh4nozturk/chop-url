import { generateTOTP, verifyTOTP } from '@chop-url/lib';
import { D1Database } from '@cloudflare/workers-types';
import {
  AuthAttemptType,
  AuthError,
  AuthErrorCode,
  IAuthResponse,
  ILoginCredentials,
  IRegisterCredentials,
  IUser,
  IUserRow,
} from './types.js';

const MAX_ATTEMPTS = 5; // Maximum number of attempts within the time window
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

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
        'SELECT id, email, password_hash, is_email_verified, is_two_factor_enabled, created_at, updated_at FROM users WHERE email = ?'
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

    // If 2FA is enabled, return early with requiresTwoFactor flag
    if (user.is_two_factor_enabled) {
      return {
        user: this.mapUserRow(user),
        token: '',
        expiresAt: new Date(),
        requiresTwoFactor: true,
      };
    }

    // Create session
    const { token, expiresAt } = await this.createSession(user.id);

    return {
      user: this.mapUserRow(user),
      token,
      expiresAt,
      requiresTwoFactor: false,
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

  async setupTwoFactor(
    userId: number
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    // Get user
    const user = await this.db
      .prepare('SELECT email FROM users WHERE id = ?')
      .bind(userId)
      .first<{ email: string }>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Generate TOTP secret
    const secret = crypto.randomUUID().replace(/-/g, '');

    // Save secret to database
    await this.db
      .prepare('UPDATE users SET two_factor_secret = ? WHERE id = ?')
      .bind(secret, userId)
      .run();

    // Generate QR code URL
    const qrCodeUrl = `otpauth://totp/ChopURL:${user.email}?secret=${secret}&issuer=ChopURL`;

    return { secret, qrCodeUrl };
  }

  private async checkRateLimit(
    userId: number,
    ipAddress: string,
    attemptType: AuthAttemptType
  ): Promise<void> {
    // Get recent attempts within the time window
    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW).toISOString();
    const attempts = await this.db
      .prepare(
        'SELECT COUNT(*) as count FROM auth_attempts WHERE user_id = ? AND ip_address = ? AND attempt_type = ? AND created_at > ?'
      )
      .bind(userId, ipAddress, attemptType, windowStart)
      .first<{ count: number }>();

    if (attempts && attempts.count >= MAX_ATTEMPTS) {
      throw new AuthError(
        AuthErrorCode.TOO_MANY_ATTEMPTS,
        `Too many attempts. Please try again after ${Math.ceil(
          ATTEMPT_WINDOW / 60000
        )} minutes.`
      );
    }
  }

  private async recordAuthAttempt(
    userId: number,
    ipAddress: string,
    attemptType: AuthAttemptType,
    isSuccessful: boolean
  ): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO auth_attempts (user_id, ip_address, attempt_type, is_successful) VALUES (?, ?, ?, ?)'
      )
      .bind(userId, ipAddress, attemptType, isSuccessful)
      .run();
  }

  async verifyTwoFactorSetup(
    userId: number,
    code: string,
    ipAddress: string
  ): Promise<string[]> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, 'totp');

    // Get user
    const user = await this.db
      .prepare('SELECT two_factor_secret FROM users WHERE id = ?')
      .bind(userId)
      .first<{ two_factor_secret: string }>();

    if (!user?.two_factor_secret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Verify code
    const isValid = await verifyTOTP(code, user.two_factor_secret);

    // Record attempt
    await this.recordAuthAttempt(userId, ipAddress, 'totp', isValid);

    if (!isValid) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
    }

    // Enable 2FA
    await this.db
      .prepare('UPDATE users SET is_two_factor_enabled = TRUE WHERE id = ?')
      .bind(userId)
      .run();

    // Generate recovery codes
    const recoveryCodes = await this.generateRecoveryCodes(userId);
    return recoveryCodes;
  }

  async verifyTwoFactorLogin(
    email: string,
    code: string,
    ipAddress: string
  ): Promise<IAuthResponse> {
    // Get user
    const user = await this.db
      .prepare(
        'SELECT id, email, is_email_verified, is_two_factor_enabled, two_factor_secret, created_at, updated_at FROM users WHERE email = ?'
      )
      .bind(email)
      .first<IUserRow>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    if (!user.is_two_factor_enabled || !user.two_factor_secret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Check rate limit
    await this.checkRateLimit(user.id, ipAddress, 'totp');

    // First try TOTP code
    const isValidTOTP = await verifyTOTP(code, user.two_factor_secret);
    let isSuccessful = false;

    if (isValidTOTP) {
      isSuccessful = true;
    } else {
      // If TOTP fails, try recovery code
      const isValidRecovery = await this.verifyRecoveryCode(user.id, code);
      if (isValidRecovery) {
        isSuccessful = true;
        await this.recordAuthAttempt(user.id, ipAddress, 'recovery', true);
      } else {
        await this.recordAuthAttempt(user.id, ipAddress, 'totp', false);
        throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
      }
    }

    // Record successful TOTP attempt if we got here
    if (isValidTOTP) {
      await this.recordAuthAttempt(user.id, ipAddress, 'totp', true);
    }

    // Create session
    const { token, expiresAt } = await this.createSession(user.id);

    return {
      user: this.mapUserRow(user),
      token,
      expiresAt,
      requiresTwoFactor: false,
    };
  }

  async disableTwoFactor(
    userId: number,
    code: string,
    ipAddress: string
  ): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, 'totp');

    // Get user
    const user = await this.db
      .prepare('SELECT two_factor_secret FROM users WHERE id = ?')
      .bind(userId)
      .first<{ two_factor_secret: string }>();

    if (!user?.two_factor_secret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Verify code
    const isValid = await verifyTOTP(code, user.two_factor_secret);

    // Record attempt
    await this.recordAuthAttempt(userId, ipAddress, 'totp', isValid);

    if (!isValid) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
    }

    // Disable 2FA
    await this.db
      .prepare(
        'UPDATE users SET is_two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = ?'
      )
      .bind(userId)
      .run();
  }

  async getUser(userId: number): Promise<IUser> {
    const user = await this.db
      .prepare(
        'SELECT id, email, is_email_verified, is_two_factor_enabled, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(userId)
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
      isEmailVerified: row.is_email_verified,
      isTwoFactorEnabled: row.is_two_factor_enabled,
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

  private async generateRecoveryCodes(userId: number): Promise<string[]> {
    // Generate 10 random recovery codes
    const codes: string[] = Array.from({ length: 10 }, () =>
      Array.from({ length: 4 }, () =>
        Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, '0')
      ).join('-')
    );

    // Save codes to database
    const stmt = this.db.prepare(
      'INSERT INTO recovery_codes (user_id, code) VALUES (?, ?)'
    );

    for (const code of codes) {
      await stmt.bind(userId, code).run();
    }

    return codes;
  }

  private async verifyRecoveryCode(
    userId: number,
    code: string
  ): Promise<boolean> {
    // Get and verify recovery code
    const recoveryCode = await this.db
      .prepare(
        'SELECT id FROM recovery_codes WHERE user_id = ? AND code = ? AND is_used = FALSE'
      )
      .bind(userId, code)
      .first<{ id: number }>();

    if (!recoveryCode) {
      return false;
    }

    // Mark code as used
    await this.db
      .prepare(
        'UPDATE recovery_codes SET is_used = TRUE, used_at = datetime("now") WHERE id = ?'
      )
      .bind(recoveryCode.id)
      .run();

    return true;
  }

  async getRecoveryCodes(userId: number): Promise<string[]> {
    const codes = await this.db
      .prepare(
        'SELECT code FROM recovery_codes WHERE user_id = ? AND is_used = FALSE ORDER BY created_at ASC'
      )
      .bind(userId)
      .all<{ code: string }>();

    return codes.results.map((row) => row.code);
  }

  async refreshToken(currentToken: string): Promise<IAuthResponse> {
    // Get current session and verify it
    const session = await this.db
      .prepare(
        'SELECT user_id, expires_at FROM sessions WHERE token = ? AND expires_at > datetime("now")'
      )
      .bind(currentToken)
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
        'SELECT id, email, is_email_verified, is_two_factor_enabled, created_at, updated_at FROM users WHERE id = ?'
      )
      .bind(session.user_id)
      .first<IUserRow>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Invalidate old session
    await this.db
      .prepare('DELETE FROM sessions WHERE token = ?')
      .bind(currentToken)
      .run();

    // Create new session
    const { token, expiresAt } = await this.createSession(user.id);

    return {
      user: this.mapUserRow(user),
      token,
      expiresAt,
      requiresTwoFactor: false,
    };
  }

  async updateProfile(
    userId: number,
    data: { username: string; email: string; name: string }
  ): Promise<IUser> {
    // Check if email is already taken by another user
    const existingUser = await this.db
      .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      .bind(data.email, userId)
      .first<{ id: number }>();

    if (existingUser) {
      throw new AuthError(AuthErrorCode.USER_EXISTS, 'Email is already taken');
    }

    // Update user profile
    const result = await this.db
      .prepare(
        'UPDATE users SET email = ?, username = ?, name = ?, updated_at = datetime("now") WHERE id = ? RETURNING id, email, username, name, is_email_verified, is_two_factor_enabled, created_at, updated_at'
      )
      .bind(data.email, data.username, data.name, userId)
      .first<IUserRow>();

    if (!result) {
      throw new AuthError(
        AuthErrorCode.DATABASE_ERROR,
        'Failed to update profile'
      );
    }

    return this.mapUserRow(result);
  }

  async updatePassword(
    userId: number,
    data: { currentPassword: string; newPassword: string },
    ipAddress: string
  ): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, 'password');

    // Get user's current password hash
    const user = await this.db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .bind(userId)
      .first<{ password_hash: string }>();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isValid = await this.verifyPassword(
      data.currentPassword,
      user.password_hash
    );

    // Record attempt
    await this.recordAuthAttempt(userId, ipAddress, 'password', isValid);

    if (!isValid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Current password is incorrect'
      );
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(data.newPassword);

    // Update password
    await this.db
      .prepare(
        'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?'
      )
      .bind(newPasswordHash, userId)
      .run();

    // Invalidate all existing sessions
    await this.db
      .prepare('DELETE FROM sessions WHERE user_id = ?')
      .bind(userId)
      .run();
  }
}
