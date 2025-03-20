import { Env, Variables } from '@/types';
import { z } from 'zod';
import { approveWaitListSchema } from './schemas';

export type ApproveWaitListRequest = z.infer<typeof approveWaitListSchema>;

export type WaitListStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'invited'
  | 'registered';

export interface WaitListContext {
  Bindings: Env;
  Variables: Variables;
}

export interface WaitListService {
  getWaitListUsers(): Promise<WaitListUser[]>;
  approveWaitListUser(email: string, frontendUrl: string): Promise<void>;
}

export interface WaitListUser {
  id: number;
  email: string;
  name: string;
  company: string | null;
  use_case: string;
  status: WaitListStatus;
  created_at: string;
  updated_at: string;
}
