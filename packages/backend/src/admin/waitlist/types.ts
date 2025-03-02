import { z } from 'zod';

export const approveWaitListSchema = z.object({
  email: z.string().email(),
});

export type ApproveWaitListRequest = z.infer<typeof approveWaitListSchema>;

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
  status: 'pending' | 'approved' | 'rejected' | 'invited' | 'registered';
  created_at: string;
  updated_at: string;
}
