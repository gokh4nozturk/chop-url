import { drizzle } from 'drizzle-orm/d1';
import { Context } from 'hono';
import { EmailService } from '../../email/service';
import { WaitListServiceImpl } from './service';
import { ApproveWaitListRequest, WaitListContext } from './types';

export const getWaitListUsersHandler = async (c: Context<WaitListContext>) => {
  const db = drizzle(c.env.DB);
  const emailService = new EmailService(
    c.env.RESEND_API_KEY,
    c.env.FRONTEND_URL
  );
  const waitListService = new WaitListServiceImpl(db, emailService);

  try {
    const waitListUsers = await waitListService.getWaitListUsers();
    return c.json({ waitListUsers });
  } catch (error) {
    console.error('Error fetching waitlist users:', error);
    return c.json({ error: 'Failed to fetch waitlist users' }, 500);
  }
};

export const approveWaitListUserHandler = async (
  c: Context<WaitListContext>
) => {
  const db = drizzle(c.env.DB);
  const emailService = new EmailService(
    c.env.RESEND_API_KEY,
    c.env.FRONTEND_URL
  );
  const waitListService = new WaitListServiceImpl(db, emailService);
  // @ts-ignore - Hono zValidator tip sorunu
  const { email } = c.req.valid('json') as ApproveWaitListRequest;
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
};
