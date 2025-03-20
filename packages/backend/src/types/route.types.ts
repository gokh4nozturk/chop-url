import { D1Database } from '@cloudflare/workers-types';
import { z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { IUser } from '../auth/types';
import { Database } from '../db/client';

export type Method = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

export interface Variables {
  user?: IUser;
  db: Database;
}

export type AppContext = Context<{
  Bindings: Env;
  Variables: Variables;
}>;

export type RouteHandler = (c: Context) => Promise<Response>;

declare module 'hono' {
  interface ContextVariableMap extends Variables {}
  interface Bindings extends Env {}
}

export interface RouteMetadata {
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  requiresAuth?: boolean;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface RouteSchema {
  request?: z.ZodType;
  response: z.ZodType;
  validation?: {
    description?: string;
    example?: unknown;
    deprecated?: boolean;
    required?: boolean;
    nullable?: boolean;
  };
  errors?: {
    400?: z.ZodType;
    401?: z.ZodType;
    403?: z.ZodType;
    404?: z.ZodType;
    500?: z.ZodType;
    [key: number]: z.ZodType | undefined;
  };
}

export interface RouteGroup {
  prefix: string;
  tag: string;
  description: string;
  defaultMetadata?: RouteMetadata;
  routes: RouteDefinition[];
}

export interface RouteDefinition extends RouteMetadata {
  path: string;
  method: Method;
  schema?: RouteSchema;
  handler: RouteHandler;
}

// Helper types for route registration
export interface RouteRegistrationOptions {
  basePath?: string;
  defaultMetadata?: RouteMetadata;
  errorSchema?: z.ZodType;
  successSchema?: z.ZodType;
}

export interface RegisteredRoute {
  path: string;
  method: Method;
  handler: RouteHandler;
  metadata: RouteMetadata;
  schema?: RouteSchema;
  description?: string;
}
