import { renderAsync } from '@react-email/render';
import type { Context } from 'hono';
import { env } from 'hono/adapter';
import { Resend } from 'resend';
import { WelcomeEmail } from './templates/welcome.tsx';

export const sendWelcomeEmail = async (
  c: Context,
  to: string,
  temporaryPassword: string,
  loginUrl: string
) => {
  const resend = new Resend(env<{ RESEND_API_KEY: string }>(c).RESEND_API_KEY);

  try {
    const html = await renderAsync(
      WelcomeEmail({
        temporaryPassword,
        loginUrl,
      })
    );

    const { data, error } = await resend.emails.send({
      from: 'Chop URL <noreply@chopurl.com>',
      to,
      subject: 'Welcome to Chop URL - Your Account is Ready!',
      html,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }

    return data;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};
