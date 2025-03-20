import { z } from '@hono/zod-openapi';
import { ErrorCode } from '../utils/error';

// User schema
const user = z
  .object({
    id: z.number(),
    email: z.string().email(),
    name: z.string().optional(),
    emailVerified: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
  })
  .openapi('User');

// Login schemas
const login = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    code: z.string().optional(),
  })
  .openapi('LoginRequest');

const loginResponse = z
  .object({
    token: z.string(),
    user,
  })
  .openapi('LoginResponse');

// Register schemas
const register = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    name: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
  .openapi('RegisterRequest');

// Two factor schemas
const twoFactorCode = z
  .object({
    code: z.string().length(6),
  })
  .openapi('TwoFactorCode');

const twoFactorLogin = z
  .object({
    token: z.string(),
    code: z.string().length(6),
  })
  .openapi('TwoFactorLogin');

const twoFactorSetupInit = z
  .object({
    qrCode: z.string(),
    secret: z.string(),
  })
  .openapi('TwoFactorSetupInitResponse');

const twoFactorSetup = z
  .object({
    success: z.boolean(),
    recoveryCodes: z.array(z.string()),
  })
  .openapi('TwoFactorSetupResponse');

// Profile schemas
const updateProfile = z
  .object({
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .openapi('UpdateProfile');

const userProfile = z
  .object({
    user,
  })
  .openapi('UserProfileResponse');

// Password schemas
const updatePassword = z
  .object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .openapi('UpdatePassword');

// Email verification schemas
const verifyEmail = z
  .object({
    token: z.string(),
  })
  .openapi('VerifyEmail');

// Recovery codes schema
const recoveryCodes = z
  .object({
    recoveryCodes: z.array(z.string()),
  })
  .openapi('RecoveryCodesResponse');

const oAuthUrlResponse = z
  .object({
    url: z.string(),
  })
  .openapi('OAuthUrlResponse');

const oAuthCallbackResponse = z
  .object({
    token: z.string(),
    user,
  })
  .openapi('OAuthCallbackResponse');

// Auth-specific error schemas
export const invalidCredentialsErrorSchema = z
  .object({
    code: z.literal(ErrorCode.INVALID_CREDENTIALS).openapi({
      example: ErrorCode.INVALID_CREDENTIALS,
      description: 'Invalid credentials error code',
    }),
    message: z.string().openapi({
      example: 'Invalid credentials.',
      description: 'Error message',
    }),
  })
  .openapi('InvalidCredentialsErrorSchema');

export const userExistsErrorSchema = z
  .object({
    code: z.literal(ErrorCode.USER_EXISTS).openapi({
      example: ErrorCode.USER_EXISTS,
      description: 'User already exists error code',
    }),
    message: z.string().openapi({
      example: 'User already exists.',
      description: 'Error message',
    }),
  })
  .openapi('UserExistsErrorSchema');

export const userNotFoundErrorSchema = z
  .object({
    code: z.literal(ErrorCode.USER_NOT_FOUND).openapi({
      example: ErrorCode.USER_NOT_FOUND,
      description: 'User not found error code',
    }),
    message: z.string().openapi({
      example: 'User not found.',
      description: 'Error message',
    }),
  })
  .openapi('UserNotFoundErrorSchema');

export const invalid2FACodeErrorSchema = z
  .object({
    code: z.literal(ErrorCode.INVALID_2FA_CODE).openapi({
      example: ErrorCode.INVALID_2FA_CODE,
      description: 'Invalid 2FA code error',
    }),
    message: z.string().openapi({
      example: 'Invalid 2FA code.',
      description: 'Error message',
    }),
  })
  .openapi('Invalid2FACodeErrorSchema');

export const invalidTokenErrorSchema = z
  .object({
    code: z.literal(ErrorCode.INVALID_TOKEN).openapi({
      example: ErrorCode.INVALID_TOKEN,
      description: 'Invalid token error code',
    }),
    message: z.string().openapi({
      example: 'Invalid token.',
      description: 'Error message',
    }),
  })
  .openapi('InvalidTokenErrorSchema');

export const expiredTokenErrorSchema = z
  .object({
    code: z.literal(ErrorCode.EXPIRED_TOKEN).openapi({
      example: ErrorCode.EXPIRED_TOKEN,
      description: 'Expired token error code',
    }),
    message: z.string().openapi({
      example: 'Your session has expired. Please log in again.',
      description: 'Error message',
    }),
  })
  .openapi('ExpiredTokenErrorSchema');

export const tooManyAttemptsErrorSchema = z
  .object({
    code: z.literal(ErrorCode.TOO_MANY_ATTEMPTS).openapi({
      example: ErrorCode.TOO_MANY_ATTEMPTS,
      description: 'Rate limit error code',
    }),
    message: z.string().openapi({
      example: 'Too many attempts. Please try again later.',
      description: 'Error message',
    }),
  })
  .openapi('TooManyAttemptsErrorSchema');

export const authValidationErrorSchema = z
  .object({
    code: z.literal(ErrorCode.VALIDATION_ERROR).openapi({
      example: ErrorCode.VALIDATION_ERROR,
      description: 'Validation error code',
    }),
    message: z.string().openapi({
      example: 'Invalid request body',
      description: 'Error message',
    }),
    details: z
      .array(
        z.object({
          code: z.string().openapi({
            example: 'invalid_string',
            description: 'Error code',
          }),
          message: z.string().openapi({
            example: 'Invalid email format',
            description: 'Error description',
          }),
          path: z.array(z.string()).openapi({
            example: ['email'],
            description: 'Path to the invalid field',
          }),
        })
      )
      .openapi({
        description: 'Validation error details',
        example: [
          {
            code: 'invalid_string',
            message: 'Invalid email format',
            path: ['email'],
          },
        ],
      }),
  })
  .openapi('AuthValidationErrorSchema');

// Export all schemas
export const authSchemas = {
  user,
  login,
  loginResponse,
  register,
  twoFactorCode,
  twoFactorLogin,
  twoFactorSetupInit,
  twoFactorSetup,
  updateProfile,
  userProfile,
  updatePassword,
  verifyEmail,
  recoveryCodes,
  oAuthUrlResponse,
  oAuthCallbackResponse,
  // Error schemas
  invalidCredentialsError: invalidCredentialsErrorSchema,
  userExistsError: userExistsErrorSchema,
  userNotFoundError: userNotFoundErrorSchema,
  invalid2FACodeError: invalid2FACodeErrorSchema,
  invalidTokenError: invalidTokenErrorSchema,
  expiredTokenError: expiredTokenErrorSchema,
  tooManyAttemptsError: tooManyAttemptsErrorSchema,
  validationError: authValidationErrorSchema,
} as const;
