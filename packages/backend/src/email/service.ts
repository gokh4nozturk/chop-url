import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Resend API key is required');
    }
    console.log(
      'Initializing EmailService with API key:',
      apiKey ? 'present' : 'missing'
    );
    this.resend = new Resend(apiKey);
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
}
