/**
 * Email Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock SendGrid
const mockSend = jest.fn();
jest.mock('@sendgrid/mail', () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: mockSend,
  },
}));

jest.mock('../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    sendgrid: {
      apiKey: 'test-api-key',
      fromEmail: 'test@example.com',
      fromName: 'ComplyEasy AI',
    },
    server: {
      clientUrl: 'http://localhost:3000',
    },
  },
}));

import emailService from '../../../services/emailService';

describe('EmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  describe('sendEmail()', () => {
    it('should send email successfully', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
      };

      const result = await emailService.sendEmail(options);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        })
      );
    });

    it('should handle email send failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('SendGrid error'));

      const options = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      const result = await emailService.sendEmail(options);

      expect(result).toBe(false);
    });

    it('should use default text when not provided', async () => {
      const options = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test</p>',
      };

      await emailService.sendEmail(options);

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
        })
      );
    });
  });

  describe('sendMagicLink()', () => {
    it('should send magic link email', async () => {
      const email = 'user@example.com';
      const token = 'test-token-123';

      const result = await emailService.sendMagicLink(email, token);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Sign in to ComplyEasy AI',
        })
      );
    });

    it('should include magic link in email', async () => {
      const email = 'user@example.com';
      const token = 'test-token-123';

      await emailService.sendMagicLink(email, token);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(token);
      expect(callArgs.text).toContain(token);
    });

    it('should handle send failure', async () => {
      mockSend.mockRejectedValueOnce(new Error('Send failed'));

      const result = await emailService.sendMagicLink('user@example.com', 'token');

      expect(result).toBe(false);
    });
  });

  describe('sendWelcomeEmail()', () => {
    it('should send welcome email', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      const result = await emailService.sendWelcomeEmail(email, name);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Welcome'),
        })
      );
    });

    it('should include user name in welcome email', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      await emailService.sendWelcomeEmail(email, name);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(name);
    });
  });

  describe('sendPasswordResetEmail()', () => {
    it('should send password reset email', async () => {
      const email = 'user@example.com';
      const resetToken = 'reset-token-123';

      const result = await emailService.sendPasswordResetEmail(email, resetToken);

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: expect.stringContaining('Password Reset'),
        })
      );
    });

    it('should include reset token in email', async () => {
      const email = 'user@example.com';
      const resetToken = 'reset-token-123';

      await emailService.sendPasswordResetEmail(email, resetToken);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.html).toContain(resetToken);
    });
  });
});

