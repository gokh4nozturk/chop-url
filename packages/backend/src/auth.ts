import { Env } from './index.js';
import { createHash, randomBytes } from 'node:crypto';

export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthRequest {
  email: string;
  password: string;
}

// 1 hour token expiration
const TOKEN_EXPIRATION = 60 * 60;

// Helper function to hash passwords
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Helper function to generate a random token
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

// Helper function to validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function to validate password strength
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Helper function to create a new user
export async function createUser(
  env: Env,
  email: string,
  password: string
): Promise<User> {
  const passwordHash = hashPassword(password);

  const result = await env.DB.prepare(
    'INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email, created_at, updated_at'
  )
    .bind(email, passwordHash)
    .first<User>();

  if (!result) {
    throw new Error('Failed to create user');
  }

  return result;
}

// Helper function to verify user credentials
export async function verifyUser(
  env: Env,
  email: string,
  password: string
): Promise<User | null> {
  const passwordHash = hashPassword(password);

  const user = await env.DB.prepare(
    'SELECT id, email, created_at, updated_at FROM users WHERE email = ? AND password_hash = ?'
  )
    .bind(email, passwordHash)
    .first<User>();

  return user || null;
}

// Helper function to get user by ID
export async function getUserById(env: Env, id: number): Promise<User | null> {
  const user = await env.DB.prepare(
    'SELECT id, email, created_at, updated_at FROM users WHERE id = ?'
  )
    .bind(id)
    .first<User>();

  return user || null;
}

// Helper function to create a session token
export async function createSession(env: Env, userId: number): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(
    Date.now() + TOKEN_EXPIRATION * 1000
  ).toISOString();

  await env.DB.prepare(
    'INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)'
  )
    .bind(userId, token, expiresAt)
    .run();

  return token;
}

// Helper function to verify a session token
export async function verifySession(
  env: Env,
  token: string
): Promise<User | null> {
  const session = await env.DB.prepare(
    `SELECT u.id, u.email, u.created_at, u.updated_at 
     FROM sessions s 
     JOIN users u ON s.user_id = u.id 
     WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP`
  )
    .bind(token)
    .first<User>();

  return session || null;
}

// Helper function to delete a session
export async function deleteSession(env: Env, token: string): Promise<void> {
  await env.DB.prepare('DELETE FROM sessions WHERE token = ?')
    .bind(token)
    .run();
}
