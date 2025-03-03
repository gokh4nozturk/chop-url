import { Env, Variables } from '../types';

export type StorageOperation = 'read' | 'write';

export interface PresignedUrlRequest {
  path: string;
  operation?: StorageOperation;
}

export interface PresignedUrlResponse {
  url: string;
}

export interface PublicUrlRequest {
  path: string;
}

export interface PublicUrlResponse {
  url: string;
}

export interface StorageContext {
  Bindings: Env;
  Variables: Variables;
}
