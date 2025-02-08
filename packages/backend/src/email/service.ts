import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async sendVerificationEmail(
    to: string,
    verificationLink: string,
    name: string
  ): Promise<void> {
    try {
      await this.resend.emails.send({
        from: 'ChopURL <noreply@chop-url.com>',
        to: [to],
        subject: 'Verify your email address',
        html: `
          <div>
            <h1>Hello ${name},</h1>
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
      });
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error('Email could not be sent');
    }
  }
}
