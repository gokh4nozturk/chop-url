import { Resend } from 'resend';

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

  constructor(resendApiKey?: string) {
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
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

      const emailContent = {
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: 'Welcome to ChopURL',
        html: `
          <div>
            <img src="https://chop-url.com/logo.svg" alt="ChopURL Logo" style="width: 100px; height: 100px; border-radius: 50%;">
            <h1>Hello ${name},</h1>
            <p>Welcome to ChopURL! We're excited to have you on board.</p>
            <p>Click the button below to get started:</p>
            <a href="https://chop-url.com" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 24px 0;">
              Get Started
            </a>
            <p>Or copy and paste the following link into your browser:</p>
            <p>https://chop-url.com</p>
            <p>We're here to help you create and manage your URLs.</p>
            <p>Best regards,<br>ChopURL Team</p>
          </div>
        `,
      };

      console.log('EmailService: Prepared email content');

      const response = await this.resend.emails.send(emailContent);

      console.log('EmailService: Email sent successfully', response);
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

      const emailContent = {
        from: 'ChopURL <noreply@chop-url.com>',
        to: [user.email],
        subject: 'Verify your email address',
        html: `
          <div>
            <img src="https://chop-url.com/logo.svg" alt="ChopURL Logo" style="width: 100px; height: 100px; border-radius: 50%;">
            <h1>Hello ${user.name},</h1>
            <p>Thank you for creating a ChopURL account.</p>
            <p>Click the button below to verify your email address:</p>
            <a href="${verificationLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 24px 0;">
              Verify Email Address
            </a>
            <p>Or copy and paste the following link into your browser:</p>
            <p>${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you did not create this account, you can ignore this email.</p>
            <p>Best regards,<br>ChopURL Team</p>
          </div>
        `,
      };

      console.log('EmailService: Prepared email content');

      const response = await this.resend.emails.send(emailContent);
      console.log('EmailService: Email sent successfully', response);
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

  async sendPasswordResetEmail(
    to: string,
    resetLink: string,
    name: string
  ): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      console.log('EmailService: Starting to send password reset email', {
        to,
        name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const emailContent = {
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: 'Reset your password',
        html: `
          <div>
            <img src="https://chop-url.com/logo.svg" alt="ChopURL Logo" style="width: 100px; height: 100px; border-radius: 50%;">
            <h1>Hello ${name},</h1>
            <p>We received a request to reset your password.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 24px 0;">
              Reset Password
            </a>
            <p>Or copy and paste the following link into your browser:</p>
            <p>${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, you can ignore this email.</p>
            <p>Best regards,<br>ChopURL Team</p>
          </div>
        `,
      };

      console.log('EmailService: Prepared email content');

      const response = await this.resend.emails.send(emailContent);
      console.log('EmailService: Email sent successfully', response);
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

  async sendUsageReportEmail(
    to: string,
    name: string,
    stats: UsageStats
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

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      };

      const topUrlsList = stats.topUrls
        .map(
          (url) => `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <a href="${url.shortUrl}" style="color: #0070f3; text-decoration: none;">
                ${url.shortUrl}
              </a>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd;">
              <a href="${url.originalUrl}" style="color: #666; text-decoration: none;">
                ${
                  url.originalUrl.length > 50
                    ? `${url.originalUrl.substring(0, 47)}...`
                    : url.originalUrl
                }
              </a>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
              ${url.visits}
            </td>
          </tr>
        `
        )
        .join('');

      const emailContent = {
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: `Your ChopURL Usage Report (${formatDate(
          stats.periodStart
        )} - ${formatDate(stats.periodEnd)})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <img src="https://chop-url.com/logo.svg" alt="ChopURL Logo" style="width: 100px; height: 100px; border-radius: 50%; margin: 20px 0;">
            
            <h1 style="color: #333;">Hello ${name},</h1>
            
            <p style="color: #666;">Here's your URL usage report for the period:</p>
            <p style="color: #666; font-weight: bold;">
              ${formatDate(stats.periodStart)} - ${formatDate(stats.periodEnd)}
            </p>

            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin-bottom: 15px;">Summary</h2>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="text-align: center; flex: 1;">
                  <div style="font-size: 24px; font-weight: bold; color: #0070f3;">
                    ${stats.totalUrls}
                  </div>
                  <div style="color: #666;">Total URLs</div>
                </div>
                <div style="text-align: center; flex: 1;">
                  <div style="font-size: 24px; font-weight: bold; color: #0070f3;">
                    ${stats.totalVisits}
                  </div>
                  <div style="color: #666;">Total Visits</div>
                </div>
              </div>
            </div>

            <div style="margin: 20px 0;">
              <h2 style="color: #333;">Top Performing URLs</h2>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                  <tr style="background-color: #f5f5f5;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Short URL</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Original URL</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  ${topUrlsList}
                </tbody>
              </table>
            </div>

            <div style="margin: 30px 0; text-align: center;">
              <a href="https://chop-url.com/dashboard/analytics" 
                 style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View Full Analytics
              </a>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              You're receiving this email because you have enabled usage reports for your ChopURL account.
              To change your email preferences, visit your <a href="https://chop-url.com/dashboard/settings" style="color: #0070f3;">account settings</a>.
            </p>
          </div>
        `,
      };

      console.log('EmailService: Prepared email content');

      const response = await this.resend.emails.send(emailContent);
      console.log('EmailService: Email sent successfully', response);
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
}
