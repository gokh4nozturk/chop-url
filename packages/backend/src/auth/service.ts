import { generateTOTP, verifyTOTP } from '@chop-url/lib';
import { and, eq, gt, sql } from 'drizzle-orm';
import { createDb, db } from '../db/client';
import {
  authAttempts,
  emailVerifications,
  sessions,
  users,
} from '../db/schema';
import { EmailService } from '../email/service.js';
import {
  AuthAttemptType,
  AuthError,
  AuthErrorCode,
  IAuthResponse,
  IEmailVerificationRow,
  ILoginCredentials,
  IRegisterCredentials,
  IUser,
  IUserRow,
} from './types.js';

const MAX_ATTEMPTS = 5; // Maximum number of attempts within the time window
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

export class AuthService {
  private emailService: EmailService;

  constructor(
    private db: ReturnType<typeof createDb>,
    private config: {
      resendApiKey: string;
      frontendUrl: string;
    }
  ) {
    this.emailService = new EmailService(config.resendApiKey);
  }

  async register(credentials: IRegisterCredentials): Promise<IAuthResponse> {
    const { email, password, confirmPassword, name } = credentials;

    if (password !== confirmPassword) {
      throw new AuthError(
        AuthErrorCode.VALIDATION_ERROR,
        'Passwords do not match'
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      throw new AuthError(
        AuthErrorCode.USER_EXISTS,
        'This email address is already in use'
      );
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await db
      .insert(users)
      .values({
        email,
        name,
        passwordHash,
      })
      .returning()
      .get();

    if (!user) {
      throw new AuthError(
        AuthErrorCode.DATABASE_ERROR,
        'An error occurred while creating the user'
      );
    }

    // Create session
    const { token, expiresAt } = await this.createSession(user.id);

    // Send verification email
    await this.resendVerificationEmail(user.id);

    return {
      user: this.mapUserRow(user),
      token,
      expiresAt,
    };
  }

  async login(credentials: ILoginCredentials): Promise<IAuthResponse> {
    const { email, password } = credentials;

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials'
      );
    }

    // If 2FA is enabled, return early with requiresTwoFactor flag
    if (user.isTwoFactorEnabled) {
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
    try {
      console.log('verifyToken - starting token verification');

      // Get session
      const session = await db
        .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
        .from(sessions)
        .where(
          and(
            eq(sessions.token, token),
            gt(sessions.expiresAt, new Date().toISOString())
          )
        )
        .get();

      console.log('verifyToken - session query result:', session);

      if (!session) {
        throw new AuthError(
          AuthErrorCode.INVALID_TOKEN,
          'Invalid or expired token'
        );
      }

      // Get user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, session?.userId ?? 0))
        .get();

      console.log('verifyToken - user query result:', user);

      if (!user) {
        throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
      }

      return this.mapUserRow(user);
    } catch (error) {
      console.error('verifyToken error:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        token: `${token.substring(0, 8)}...`,
      });
      throw error;
    }
  }

  async setupTwoFactor(
    userId: number
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    // Get user
    const user = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Generate TOTP secret
    const secret = crypto.randomUUID().replace(/-/g, '');

    // Save secret to database
    await db
      .update(users)
      .set({ twoFactorSecret: secret })
      .where(eq(users.id, userId))
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
    const windowStart = new Date(Date.now() - ATTEMPT_WINDOW);
    const attempts = await db
      .select({ count: sql`count(*)` })
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.userId, userId),
          eq(authAttempts.ipAddress, ipAddress),
          eq(authAttempts.attemptType, attemptType),
          gt(authAttempts.createdAt, windowStart.toISOString())
        )
      )
      .get();

    if (attempts && Number(attempts.count) >= MAX_ATTEMPTS) {
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
    isSuccessful: boolean,
    code = 'none'
  ): Promise<void> {
    await db
      .insert(authAttempts)
      .values({
        userId,
        ipAddress,
        attemptType,
        isSuccessful,
        code,
      })
      .run();
  }

  async verifyTwoFactorSetup(
    userId: number,
    code: string,
    ipAddress: string
  ): Promise<string[]> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, AuthAttemptType.TOTP);

    // Get user
    const user = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user?.twoFactorSecret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Verify code
    const isValid = await verifyTOTP(code, user.twoFactorSecret);

    // Record attempt
    await this.recordAuthAttempt(
      userId,
      ipAddress,
      AuthAttemptType.TOTP,
      isValid,
      code
    );

    if (!isValid) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
    }

    // Enable 2FA
    await db
      .update(users)
      .set({ isTwoFactorEnabled: true })
      .where(eq(users.id, userId))
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
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    if (!user.isTwoFactorEnabled || !user.twoFactorSecret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Check rate limit
    await this.checkRateLimit(user.id, ipAddress, AuthAttemptType.TOTP);

    // First try TOTP code
    const isValidTOTP = await verifyTOTP(code, user.twoFactorSecret);
    let isSuccessful = false;

    if (isValidTOTP) {
      isSuccessful = true;
    } else {
      // If TOTP fails, try recovery code
      const isValidRecovery = await this.verifyRecoveryCode(user.id, code);
      if (isValidRecovery) {
        isSuccessful = true;
        await this.recordAuthAttempt(
          user.id,
          ipAddress,
          AuthAttemptType.RECOVERY,
          true,
          code
        );
      } else {
        await this.recordAuthAttempt(
          user.id,
          ipAddress,
          AuthAttemptType.TOTP,
          false,
          code
        );
        throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
      }
    }

    // Record successful TOTP attempt if we got here
    if (isValidTOTP) {
      await this.recordAuthAttempt(
        user.id,
        ipAddress,
        AuthAttemptType.TOTP,
        true,
        code
      );
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

  async enableTwoFactor(
    userId: number,
    code: string,
    ipAddress: string
  ): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, AuthAttemptType.TOTP);

    // Get user
    const user = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user?.twoFactorSecret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Verify code
    const isValid = await verifyTOTP(code, user.twoFactorSecret);

    if (!isValid) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
    }

    // Enable 2FA
    await db
      .update(users)
      .set({ isTwoFactorEnabled: true })
      .where(eq(users.id, userId))
      .run();
  }

  async disableTwoFactor(
    userId: number,
    code: string,
    ipAddress: string
  ): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(userId, ipAddress, AuthAttemptType.TOTP);

    // Get user
    const user = await db
      .select({ twoFactorSecret: users.twoFactorSecret })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user?.twoFactorSecret) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid setup');
    }

    // Verify code
    const isValid = await verifyTOTP(code, user.twoFactorSecret);

    // Record attempt
    await this.recordAuthAttempt(
      userId,
      ipAddress,
      AuthAttemptType.TOTP,
      isValid,
      code
    );

    if (!isValid) {
      throw new AuthError(AuthErrorCode.INVALID_2FA_CODE, 'Invalid code');
    }

    // Disable 2FA
    await db
      .update(users)
      .set({ isTwoFactorEnabled: false, twoFactorSecret: null })
      .where(eq(users.id, userId))
      .run();
  }

  async getUser(userId: number): Promise<IUser> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    return this.mapUserRow(user);
  }

  private mapUserRow(row: IUserRow): IUser {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      isEmailVerified: row.isEmailVerified ?? false,
      isTwoFactorEnabled: row.isTwoFactorEnabled ?? false,
      createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
      updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
    };
  }

  private async createSession(
    userId: number
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db
      .insert(sessions)
      .values({
        userId,
        token,
        expiresAt: expiresAt.toISOString(),
      })
      .run();

    return { token, expiresAt };
  }

  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
    const stmt = db.insert(authAttempts).values(
      codes.map((code) => ({
        userId,
        ipAddress: 'system',
        attemptType: AuthAttemptType.RECOVERY,
        isSuccessful: true,
        code,
      }))
    );

    await stmt.run();

    return codes;
  }

  private async verifyRecoveryCode(
    userId: number,
    code: string
  ): Promise<boolean> {
    // Get and verify recovery code
    const recoveryCode = await db
      .select()
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.userId, userId),
          eq(authAttempts.attemptType, AuthAttemptType.RECOVERY),
          eq(authAttempts.code, code),
          eq(authAttempts.isSuccessful, true)
        )
      )
      .get();

    if (!recoveryCode) {
      return false;
    }

    // Mark code as used
    await db
      .update(authAttempts)
      .set({ isSuccessful: false })
      .where(eq(authAttempts.id, recoveryCode.id))
      .run();

    return true;
  }

  async getRecoveryCodes(userId: number): Promise<string> {
    const attempts = await db
      .select()
      .from(authAttempts)
      .where(
        and(
          eq(authAttempts.userId, userId),
          eq(authAttempts.attemptType, AuthAttemptType.RECOVERY),
          eq(authAttempts.isSuccessful, true)
        )
      )
      .get();

    return attempts?.code ?? '';
  }

  async refreshToken(currentToken: string): Promise<IAuthResponse> {
    // Get current session and verify it
    const session = await db
      .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
      .from(sessions)
      .where(
        and(
          eq(sessions.token, currentToken),
          gt(sessions.expiresAt, new Date().toISOString())
        )
      )
      .get();

    if (!session) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired token'
      );
    }

    // Get user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session?.userId ?? 0))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Invalidate old session
    await db.delete(sessions).where(eq(sessions.token, currentToken)).run();

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
    data: { email: string; name: string }
  ): Promise<IUser> {
    // Check if email is already taken by another user
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, data.email), eq(users.id, userId)))
      .get();

    if (existingUser) {
      throw new AuthError(AuthErrorCode.USER_EXISTS, 'Email is already taken');
    }

    // Update user profile
    const result = await db
      .update(users)
      .set({
        email: data.email,
        name: data.name,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .returning()
      .get();

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
    await this.checkRateLimit(userId, ipAddress, AuthAttemptType.PASSWORD);

    // Get user's current password hash
    const user = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
    }

    // Verify current password
    const isValid = await this.verifyPassword(
      data.currentPassword,
      user.passwordHash
    );

    // Record attempt
    await this.recordAuthAttempt(
      userId,
      ipAddress,
      AuthAttemptType.PASSWORD,
      isValid,
      data.currentPassword
    );

    if (!isValid) {
      throw new AuthError(
        AuthErrorCode.INVALID_CREDENTIALS,
        'Current password is incorrect'
      );
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(data.newPassword);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, userId))
      .run();

    // Invalidate all existing sessions
    await db.delete(sessions).where(eq(sessions.userId, userId)).run();
  }

  async verifyEmail(token: string, userId: number): Promise<void> {
    // Check rate limit
    await this.checkRateLimit(
      userId,
      'system',
      AuthAttemptType.EMAIL_VERIFICATION
    );

    // Get and verify token
    const verificationRecord = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.userId, userId),
          eq(emailVerifications.token, token),
          eq(emailVerifications.isUsed, false)
        )
      )
      .get();

    if (!verificationRecord) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Invalid or expired verification token'
      );
    }

    if (new Date(verificationRecord.expiresAt) < new Date()) {
      throw new AuthError(
        AuthErrorCode.INVALID_TOKEN,
        'Verification token has expired'
      );
    }

    // Mark token as used and verify email
    await db
      .update(emailVerifications)
      .set({ isUsed: true })
      .where(eq(emailVerifications.id, verificationRecord.id))
      .run();

    await db
      .update(users)
      .set({ isEmailVerified: true })
      .where(eq(users.id, userId))
      .run();

    // Record successful attempt
    await this.recordAuthAttempt(
      userId,
      'system',
      AuthAttemptType.EMAIL_VERIFICATION,
      true,
      token
    );
  }

  async resendVerificationEmail(userId: number): Promise<void> {
    try {
      console.log('Starting resendVerificationEmail for userId:', userId);

      // Check rate limit
      await this.checkRateLimit(
        userId,
        'system',
        AuthAttemptType.EMAIL_VERIFICATION
      );
      console.log('Rate limit check passed');

      await this.sendVerificationEmail(userId);
      console.log('Email sent successfully');
    } catch (error) {
      console.error('Error in resendVerificationEmail:', {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async sendVerificationEmail(userId: number): Promise<void> {
    try {
      console.log('Starting sendVerificationEmail for userId:', userId);

      // Get user
      const user = await db
        .select({ email: users.email, name: users.name })
        .from(users)
        .where(eq(users.id, userId))
        .get();

      console.log('User query result:', user);

      if (!user) {
        throw new AuthError(AuthErrorCode.USER_NOT_FOUND, 'User not found');
      }

      // Generate verification token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      console.log('Generated token and expiry:', { token, expiresAt });

      // Save token to database
      await db
        .insert(emailVerifications)
        .values({
          userId,
          token,
          expiresAt: expiresAt.toISOString(),
        })
        .run();

      console.log('Token saved to database');

      // Create verification link
      const verificationLink = `${this.config.frontendUrl}/auth/verify-email?token=${token}&userId=${userId}`;
      console.log('Generated verification link:', verificationLink);

      // Send email
      await this.emailService.sendVerificationEmail(
        user.email,
        verificationLink,
        user.name
      );
      console.log('Email sent via Resend');

      // Record attempt
      await this.recordAuthAttempt(
        userId,
        'system',
        AuthAttemptType.EMAIL_VERIFICATION,
        true,
        token
      );
      console.log('Auth attempt recorded');
    } catch (error) {
      console.error('Error in sendVerificationEmail:', {
        userId,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
