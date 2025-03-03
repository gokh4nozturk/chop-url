import { eq } from 'drizzle-orm';
import { DrizzleD1Database } from 'drizzle-orm/d1';
import { IUserRow, IWaitListRow } from '../../auth/types';
import { users, waitList } from '../../db/schema';
import { EmailService } from '../../email/service';
import { generateTemporaryPassword, hashPassword } from '../../utils/password';
import { WaitListService, WaitListUser } from './types';

export class WaitListServiceImpl implements WaitListService {
  constructor(
    private readonly db: DrizzleD1Database,
    private readonly emailService: EmailService
  ) {}

  async getWaitListUsers(): Promise<WaitListUser[]> {
    const waitListUsers = await this.db
      .select()
      .from(waitList)
      .where(eq(waitList.status, 'pending'))
      .orderBy(waitList.createdAt);

    return waitListUsers.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      use_case: user.useCase,
      status: user.status,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    }));
  }

  async approveWaitListUser(email: string, frontendUrl: string): Promise<void> {
    // Check if WaitList user exists
    const waitListUser = await this.db
      .select()
      .from(waitList)
      .where(eq(waitList.email, email))
      .get();

    if (!waitListUser) {
      throw new Error('WaitList user not found');
    }

    if (waitListUser.status !== 'pending') {
      throw new Error('User already processed');
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    try {
      // Create user account
      await this.db.insert(users).values({
        email,
        name: waitListUser.name,
        passwordHash: hashedPassword,
        isEmailVerified: true,
      } as unknown as IUserRow);

      // Update WaitList status
      await this.db
        .update(waitList)
        .set({ status: 'approved' as const } as unknown as IWaitListRow)
        .where(eq(waitList.email, email));

      // Send welcome email
      await this.emailService.sendApprovedWaitListEmail(
        email,
        temporaryPassword,
        `${frontendUrl}/login`
      );
    } catch (error) {
      console.error('Error approving waitlist user:', error);
      throw new Error('Failed to process waitlist approval');
    }
  }
}
