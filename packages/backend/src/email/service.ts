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

  async sendVerificationEmail(
    to: string,
    verificationLink: string,
    name: string
  ): Promise<void> {
    try {
      if (!this.resend) {
        throw new Error('Resend client is not initialized');
      }

      console.log('EmailService: Starting to send verification email', {
        to,
        name,
        apiKey: this.resend ? 'present' : 'missing',
      });

      const emailContent = {
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
