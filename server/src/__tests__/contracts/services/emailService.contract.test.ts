/**
 * Email Service Contract Tests
 *
 * Verifies the contract for email sending, magic link generation,
 * template rendering, and SendGrid API integration shapes.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockSgMailSend = jest.fn();
const mockSgMailSetApiKey = jest.fn();

jest.mock('@sendgrid/mail', () => ({
  setApiKey: mockSgMailSetApiKey,
  send: mockSgMailSend,
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    sendgrid: {
      apiKey: 'SG.test-key-123',
      fromEmail: 'no-reply@complyeasy.ai',
      fromName: 'ComplyEasy AI',
    },
    server: {
      clientUrl: 'http://localhost:3000',
    },
  },
}));

jest.mock('../../../config/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

import emailService from '../../../services/emailService';

describe('EmailService contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSgMailSend.mockResolvedValue([{ statusCode: 202 }]);
  });

  // ---------------------------------------------------------------------------
  // sendEmail
  // ---------------------------------------------------------------------------
  describe('sendEmail', () => {
    it('should call sgMail.send with correct message shape', async () => {
      await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Compliance Alert',
        html: '<h1>Alert</h1>',
        text: 'Alert',
      });

      expect(mockSgMailSend).toHaveBeenCalledWith({
        to: 'user@example.com',
        from: {
          email: 'no-reply@complyeasy.ai',
          name: 'ComplyEasy AI',
        },
        subject: 'Compliance Alert',
        text: 'Alert',
        html: '<h1>Alert</h1>',
      });
    });

    it('should return true on successful send', async () => {
      const result = await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(result).toBe(true);
    });

    it('should propagate SendGrid errors', async () => {
      mockSgMailSend.mockRejectedValue(new Error('Unauthorized'));

      await expect(
        emailService.sendEmail({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow();
    });

    it('should default text to empty string when not provided', async () => {
      await emailService.sendEmail({
        to: 'user@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      });

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // sendMagicLink
  // ---------------------------------------------------------------------------
  describe('sendMagicLink', () => {
    it('should send email with magic link URL containing token', async () => {
      await emailService.sendMagicLink('user@example.com', 'magic-token-123');

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('ComplyEasy'),
          html: expect.stringContaining('magic-token-123'),
        })
      );
    });

    it('should include the client URL in the magic link', async () => {
      await emailService.sendMagicLink('user@example.com', 'token-456');

      expect(mockSgMailSend).toHaveBeenCalledWith(
        expect.objectContaining({
          html: expect.stringContaining('http://localhost:3000/auth/verify'),
        })
      );
    });

    it('should return true on successful send', async () => {
      const result = await emailService.sendMagicLink('user@example.com', 'token');
      expect(result).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling contracts
  // ---------------------------------------------------------------------------
  describe('error handling', () => {
    it('should throw specific message for 401 Unauthorized errors', async () => {
      const error = new Error('Unauthorized') as any;
      error.code = 401;
      mockSgMailSend.mockRejectedValue(error);

      await expect(
        emailService.sendEmail({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow(/invalid/i);
    });

    it('should throw specific message for 403 Forbidden errors', async () => {
      const error = new Error('Forbidden') as any;
      error.code = 403;
      mockSgMailSend.mockRejectedValue(error);

      await expect(
        emailService.sendEmail({
          to: 'user@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
        })
      ).rejects.toThrow(/permission/i);
    });
  });
});
