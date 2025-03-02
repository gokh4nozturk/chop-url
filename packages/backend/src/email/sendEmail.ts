import { renderAsync } from '@react-email/render';
import { Resend } from 'resend';
import { WelcomeEmail } from './templates/welcome.tsx';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendWelcomeEmailParams {
  to: string;
  username: string;
  temporaryPassword: string;
  loginUrl: string;
}

export const sendWelcomeEmail = async ({
  to,
  username,
  temporaryPassword,
  loginUrl,
}: SendWelcomeEmailParams) => {
  try {
    const html = await renderAsync(
      WelcomeEmail({
        username,
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
