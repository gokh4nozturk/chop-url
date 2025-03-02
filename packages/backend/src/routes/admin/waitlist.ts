import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { z } from 'zod';
import { users, waitList } from '../../db/schema';
import { sendWelcomeEmail } from '../../email/sendEmail';
import { Env } from '../../types';
import { generateTemporaryPassword, hashPassword } from '../../utils/password';

const waitListRouter = new Hono<{ Bindings: Env }>();

// WaitList users list
waitListRouter.get('/', async (c) => {
  const db = drizzle(c.env.DB);

  const waitListUsers = await db
    .select()
    .from(waitList)
    .where(eq(waitList.status, 'pending'))
    .orderBy(waitList.created_at);

  return c.json({ waitListUsers });
});

// Approve WaitList user and create account
const approveSchema = z.object({
  email: z.string().email(),
});

waitListRouter.post(
  '/approve',
  zValidator('json', approveSchema),
  async (c) => {
    const db = drizzle(c.env.DB);
    const { email } = c.req.valid('json');

    // Check if WaitList user exists
    const waitListUser = await db
      .select()
      .from(waitList)
      .where(eq(waitList.email, email))
      .get();

    if (!waitListUser) {
      return c.json({ error: 'WaitList user not found' }, 404);
    }

    if (waitListUser.status !== 'pending') {
      return c.json({ error: 'User already processed' }, 400);
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    try {
      // Kullanıcı hesabını oluştur
      await db.insert(users).values({
        email,
        name: waitListUser.name,
        passwordHash: hashedPassword,
        isEmailVerified: true,
      });

      // Update WaitList status
      await db
        .update(waitList)
        .set({ status: 'approved' })
        .where(eq(waitList.email, email));

      // Send welcome email
      await sendWelcomeEmail({
        to: email,
        temporaryPassword,
        loginUrl: 'https://chopurl.com/login',
      });

      return c.json({
        success: true,
        message: 'User account created and welcome email sent',
      });
    } catch (error) {
      console.error('Error approving waitlist user:', error);
      return c.json({ error: 'Failed to process waitlist approval' }, 500);
    }
  }
);

export { waitListRouter };
