import { zValidator } from '@hono/zod-validator';
import { drizzle } from 'drizzle-orm/d1';
import { Hono } from 'hono';
import { EmailService } from '../../email/service';
import { Env } from '../../types';
import { WaitListServiceImpl } from './service';
import { approveWaitListSchema } from './types';

export const createWaitListRoutes = () => {
  const router = new Hono<{ Bindings: Env }>();

  // WaitList users list
  router.get('/waitlist', async (c) => {
    const db = drizzle(c.env.DB);
    const emailService = new EmailService(c.env.RESEND_API_KEY);
    const waitListService = new WaitListServiceImpl(
      db,
      emailService,
      c.env.FRONTEND_URL,
      c.env.RESEND_API_KEY
    );

    try {
      const waitListUsers = await waitListService.getWaitListUsers();
      return c.json({ waitListUsers });
    } catch (error) {
      console.error('Error fetching waitlist users:', error);
      return c.json({ error: 'Failed to fetch waitlist users' }, 500);
    }
  });

  // Approve WaitList user and create account
  router.post(
    '/waitlist/approve',
    zValidator('json', approveWaitListSchema),
    async (c) => {
      const db = drizzle(c.env.DB);
      const emailService = new EmailService(c.env.RESEND_API_KEY);
      const waitListService = new WaitListServiceImpl(
        db,
        emailService,
        c.env.FRONTEND_URL,
        c.env.RESEND_API_KEY
      );
      const { email } = c.req.valid('json');
      const frontendUrl = c.env.FRONTEND_URL;

      try {
        await waitListService.approveWaitListUser(email, frontendUrl);
        return c.json({
          success: true,
          message: 'User account created and welcome email sent',
        });
      } catch (error) {
        if (error instanceof Error) {
          return c.json({ error: error.message }, 400);
        }
        return c.json({ error: 'Failed to process waitlist approval' }, 500);
      }
    }
  );

  return router;
};
