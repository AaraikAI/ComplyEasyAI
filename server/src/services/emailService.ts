import sgMail from '@sendgrid/mail';
import config from '../config';
import logger from '../config/logger';

sgMail.setApiKey(config.sendgrid.apiKey);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: {
          email: config.sendgrid.fromEmail,
          name: config.sendgrid.fromName,
        },
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      };

      await sgMail.send(msg);
      logger.info(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email', error);
      return false;
    }
  }

  async sendMagicLink(email: string, token: string): Promise<boolean> {
    const magicLink = `${config.server.clientUrl}/auth/verify?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0284c7;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to ComplyEasy AI</h2>
          <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" class="button">Sign In to ComplyEasy</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #0284c7;">${magicLink}</p>
          <div class="footer">
            <p>If you didn't request this email, you can safely ignore it.</p>
            <p>&copy; 2024 ComplyEasy AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Welcome to ComplyEasy AI\n\nClick the link below to sign in:\n${magicLink}\n\nThis link will expire in 15 minutes.\n\nIf you didn't request this email, you can safely ignore it.`;

    return this.sendEmail({
      to: email,
      subject: 'Sign in to ComplyEasy AI',
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0284c7;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Welcome to ComplyEasy AI, ${name}!</h2>
          <p>Thank you for joining ComplyEasy AI. We're excited to help you automate your compliance workflows.</p>
          <h3>Get Started:</h3>
          <ul>
            <li>Add your first compliance framework</li>
            <li>Connect your integrations (AWS, GitHub, etc.)</li>
            <li>Run your first risk assessment</li>
            <li>Explore our AI-powered tools</li>
          </ul>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${config.server.clientUrl}" class="button">Go to Dashboard</a>
          </p>
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to ComplyEasy AI',
      html,
    });
  }

  async sendPasswordReset(email: string, token: string): Promise<boolean> {
    const resetLink = `${config.server.clientUrl}/auth/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #0284c7;
            color: #ffffff;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Reset Your Password</h2>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>If you didn't request a password reset, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - ComplyEasy AI',
      html,
    });
  }
}

export default new EmailService();
