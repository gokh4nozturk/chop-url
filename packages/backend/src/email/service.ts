import { renderAsync } from '@react-email/render';
import { Resend } from 'resend';
import { ApprovedWaitListEmail } from './templates/approved-waitlist';
import { ResetPassword } from './templates/reset-password';
import { UsageReport } from './templates/usage-report';
import { VerifyEmail } from './templates/verify-email';
import { WelcomeEmail } from './templates/welcome';

interface UsageStats {
  totalUrls: number;
  totalVisits: number;
  topUrls: Array<{
    shortUrl: string;
    originalUrl: string;
    visits: number;
  }>;
  periodStart: Date;
  periodEnd: Date;
}

export class EmailService {
  private resend: Resend | null = null;
  private frontendUrl: string | null = null;

  constructor(resendApiKey?: string, frontendUrl?: string) {
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      this.frontendUrl = frontendUrl ?? null;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      console.log('EmailService: Starting to send welcome email', {
        to,
        name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const html = await renderAsync(
        WelcomeEmail({
          name,
          dashboardUrl: this.frontendUrl ?? 'https://app.chop-url.com',
        })
      );

      const { data, error } = await this.resend.emails.send({
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: 'Welcome to ChopURL',
        html,
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        throw new Error('Failed to send welcome email');
      }

      console.log('EmailService: Email sent successfully', data);
    } catch (error) {
      console.error('EmailService: Error sending email:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        to,
        name,
      });
      throw new Error(`Email could not be sent: ${(error as Error).message}`);
    }
  }

  async sendVerificationEmail(
    user: { email: string; name: string; id: number },
    token: string,
    frontendUrl: string
  ): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}&userId=${user.id}`;

      console.log('EmailService: Starting to send verification email', {
        to: user.email,
        name: user.name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const html = await renderAsync(
        VerifyEmail({
          name: user.name,
          verificationLink,
        })
      );

      const { data, error } = await this.resend.emails.send({
        from: 'ChopURL <noreply@chop-url.com>',
        to: [user.email],
        subject: 'Verify your email address',
        html,
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
      }

      console.log('EmailService: Email sent successfully', data);
    } catch (error) {
      console.error('EmailService: Error sending email:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        to: user.email,
        name: user.name,
      });
      throw new Error(`Email could not be sent: ${(error as Error).message}`);
    }
  }

  async sendPasswordResetEmail({
    email,
    name,
    token,
  }: {
    email: string;
    name: string;
    token: string;
  }): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      const resetLink = `${
        this.frontendUrl ?? 'https://app.chop-url.com'
      }/auth/reset-password?token=${token}`;

      console.log('EmailService: Starting to send password reset email', {
        to: email,
        name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const html = await renderAsync(
        ResetPassword({
          name,
          resetLink,
        })
      );

      const { data, error } = await this.resend.emails.send({
        from: 'ChopURL <noreply@chop-url.com>',
        to: [email],
        subject: 'Reset your password',
        html,
      });

      if (error) {
        console.error('Failed to send password reset email:', error);
        throw new Error('Failed to send password reset email');
      }

      console.log('EmailService: Email sent successfully', data);
    } catch (error) {
      console.error('EmailService: Error sending email:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        to: email,
        name,
      });
      throw new Error(`Email could not be sent: ${(error as Error).message}`);
    }
  }

  async sendUsageReportEmail(
    to: string,
    name: string,
    stats: UsageStats,
    frontendUrl: string
  ): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      console.log('EmailService: Starting to send usage report email', {
        to,
        name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const html = await renderAsync(
        UsageReport({
          name,
          stats,
          frontendUrl,
        })
      );

      const { data, error } = await this.resend.emails.send({
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: `Your ChopURL Usage Report (${stats.periodStart.toLocaleDateString()} - ${stats.periodEnd.toLocaleDateString()})`,
        html,
      });

      if (error) {
        console.error('Failed to send usage report email:', error);
        throw new Error('Failed to send usage report email');
      }

      console.log('EmailService: Email sent successfully', data);
    } catch (error) {
      console.error('EmailService: Error sending email:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        to,
        name,
      });
      throw new Error(`Email could not be sent: ${(error as Error).message}`);
    }
  }

  async sendApprovedWaitListEmail(
    to: string,
    temporaryPassword: string,
    loginUrl: string
  ): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      const html = await renderAsync(
        ApprovedWaitListEmail({
          temporaryPassword,
          loginUrl,
        })
      );

      const { data, error } = await this.resend.emails.send({
        from: 'Chop URL <noreply@chop-url.com>',
        to,
        subject: 'Welcome to Chop URL - Your Account is Ready!',
        html,
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        throw new Error('Failed to send welcome email');
      }

      console.log('EmailService: Email sent successfully', data);
    } catch (error) {
      console.error('EmailService: Error sending email:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        to,
      });
    }
  }
}
