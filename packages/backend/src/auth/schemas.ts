import { z } from '@hono/zod-openapi';

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
} as const;
