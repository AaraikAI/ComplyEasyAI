import sgMail from '@sendgrid/mail';
import config from '../config';
import logger from '../config/logger';

// Validate and set SendGrid API key
if (!config.sendgrid.apiKey) {
  logger.error('SENDGRID_API_KEY is not configured');
} else if (!config.sendgrid.apiKey.startsWith('SG.')) {
  logger.error(`Invalid SendGrid API key format. Key should start with "SG." but got: ${config.sendgrid.apiKey.substring(0, 10)}...`);
  logger.error('Please check your SENDGRID_API_KEY in the .env file. SendGrid API keys start with "SG."');
} else {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if SendGrid is configured
      if (!config.sendgrid.apiKey) {
        logger.error('SENDGRID_API_KEY is not configured. Cannot send email.');
        throw new Error('Email service is not configured. Please set SENDGRID_API_KEY in your .env file.');
      }

      if (!config.sendgrid.apiKey.startsWith('SG.')) {
        logger.error(`Invalid SendGrid API key format. Key should start with "SG."`);
        throw new Error('Invalid SendGrid API key format. Please check your SENDGRID_API_KEY in the .env file.');
      }

      if (!config.sendgrid.fromEmail) {
        logger.error('SENDGRID_FROM_EMAIL is not configured.');
        throw new Error('Email sender is not configured. Please set SENDGRID_FROM_EMAIL in your .env file.');
      }

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
      logger.info(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error: any) {
      logger.error('Failed to send email', {
        error: error.message,
        code: error.code,
        response: error.response?.body,
        to: options.to,
      });
      
      // Provide more specific error messages
      if (error.code === 401 || error.message?.includes('Unauthorized')) {
        throw new Error('SendGrid API key is invalid. Please check your SENDGRID_API_KEY in the .env file.');
      }
      if (error.message?.includes('Forbidden') || error.code === 403) {
        throw new Error('SendGrid API key does not have permission to send emails. Please verify your API key permissions.');
      }
      if (error.message?.includes('sender')) {
        throw new Error(`SendGrid sender email "${config.sendgrid.fromEmail}" is not verified. Please verify it in SendGrid dashboard.`);
      }
      
      throw error;
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

  async sendPaymentConfirmation(email: string, plan: string, amount: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success-icon { font-size: 48px; margin-bottom: 20px; }
          .plan-badge { display: inline-block; background: #0284c7; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="success-icon">✓</div>
            <h1>Payment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Thank you for your subscription to ComplyEasy AI!</p>
            <p><strong>Plan:</strong> <span class="plan-badge">${plan}</span></p>
            <p><strong>Amount:</strong> ${amount}</p>
            <p>Your subscription is now active. You can access all features of the ${plan} plan immediately.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <div class="footer">
              <p>This is an automated confirmation email from ComplyEasy AI.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Payment Confirmed - ${plan} Plan - ComplyEasy AI`,
      html,
    });
  }
}

export default new EmailService();
