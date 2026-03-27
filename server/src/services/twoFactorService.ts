/**
 * Two-Factor Authentication Service
 * Handles TOTP generation, verification, and backup codes
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../utils/fipsPasswordHashing';
import prisma from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/errorHandler';

interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

interface TwoFactorSecret {
  ascii: string;
  hex: string;
  base32: string;
  otpauth_url?: string;
}

class TwoFactorService {
  /**
   * Generate 2FA secret and QR code for user setup
   */
  async setupTwoFactor(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `ComplyEasy AI (${userEmail})`,
        issuer: 'ComplyEasy AI',
        length: 32,
      }) as TwoFactorSecret;

      if (!secret.otpauth_url) {
        throw new AppError('Failed to generate OTP auth URL', 500);
      }

      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = this.generateBackupCodes(8);

      // Save encrypted secret (don't enable yet - user must verify first)
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: this.encryptSecret(secret.base32),
          twoFactorVerified: false,
        },
      });

      // Save hashed backup codes
      await this.saveBackupCodes(userId, backupCodes);

      logger.info(`2FA setup initiated for user ${userId}`);

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes,
      };
    } catch (error) {
      logger.error('Error setting up 2FA', error);
      throw new AppError('Failed to setup two-factor authentication', 500);
    }
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true },
      });

      if (!user || !user.twoFactorSecret) {
        throw new AppError('2FA not set up for this user', 400);
      }

      if (user.twoFactorEnabled) {
        throw new AppError('2FA already enabled', 409);
      }

      const secret = this.decryptSecret(user.twoFactorSecret);

      // Verify token
      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2, // Allow 2 time steps before/after for clock skew
      });

      if (!verified) {
        logger.warn(`Failed 2FA verification attempt for user ${userId}`);
        return false;
      }

      // Enable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          twoFactorVerified: true,
        },
      });

      logger.info(`2FA enabled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error verifying 2FA token', error);
      throw new AppError('Failed to verify two-factor authentication', 500);
    }
  }

  /**
   * Verify TOTP token during login
   */
  async verifyTwoFactorToken(userId: string, token: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          twoFactorSecret: true,
          twoFactorEnabled: true,
          twoFactorVerified: true,
        },
      });

      if (!user || !user.twoFactorSecret || !user.twoFactorEnabled) {
        // Constant-time: perform a dummy TOTP verify to prevent timing-based user enumeration
        speakeasy.totp.verify({
          secret: 'JBSWY3DPEHPK3PXP',
          encoding: 'base32',
          token,
          window: 2,
        });
        return false;
      }

      const secret = this.decryptSecret(user.twoFactorSecret);

      const verified = speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: 2,
      });

      if (verified) {
        logger.info(`Successful 2FA verification for user ${userId}`);
      } else {
        logger.warn(`Failed 2FA verification attempt`);
      }

      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA token', error);
      return false;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const backupCodes = await prisma.twoFactorBackupCode.findMany({
        where: {
          userId,
          used: false,
        },
      });

      for (const backupCode of backupCodes) {
        const isMatch = await verifyPassword(code, backupCode.code);

        if (isMatch) {
          // Mark code as used
          await prisma.twoFactorBackupCode.update({
            where: { id: backupCode.id },
            data: {
              used: true,
              usedAt: new Date(),
            },
          });

          logger.info(`Backup code used for user ${userId}`);
          return true;
        }
      }

      logger.warn(`Invalid backup code attempt for user ${userId}`);
      return false;
    } catch (error) {
      logger.error('Error verifying backup code', error);
      return false;
    }
  }

  /**
   * Disable 2FA (requires current 2FA token or backup code)
   */
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify token first
      const verified =
        (await this.verifyTwoFactorToken(userId, token)) ||
        (await this.verifyBackupCode(userId, token));

      if (!verified) {
        return false;
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorVerified: false,
        },
      });

      // Delete all backup codes
      await prisma.twoFactorBackupCode.deleteMany({
        where: { userId },
      });

      logger.info(`2FA disabled for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('Error disabling 2FA', error);
      throw new AppError('Failed to disable two-factor authentication', 500);
    }
  }

  /**
   * Regenerate backup codes (requires 2FA token)
   */
  async regenerateBackupCodes(userId: string, token: string): Promise<string[] | null> {
    try {
      // Verify token first
      const verified = await this.verifyTwoFactorToken(userId, token);

      if (!verified) {
        return null;
      }

      // Delete old backup codes
      await prisma.twoFactorBackupCode.deleteMany({
        where: { userId },
      });

      // Generate new backup codes
      const backupCodes = this.generateBackupCodes(8);
      await this.saveBackupCodes(userId, backupCodes);

      logger.info(`Backup codes regenerated for user ${userId}`);
      return backupCodes;
    } catch (error) {
      logger.error('Error regenerating backup codes', error);
      throw new AppError('Failed to regenerate backup codes', 500);
    }
  }

  /**
   * Get remaining backup codes count
   */
  async getRemainingBackupCodesCount(userId: string): Promise<number> {
    try {
      const count = await prisma.twoFactorBackupCode.count({
        where: {
          userId,
          used: false,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting backup codes count', error);
      return 0;
    }
  }

  /**
   * Verify token (wrapper that tries both TOTP and backup code)
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Try TOTP token first
      const totpVerified = await this.verifyTwoFactorToken(userId, token);
      if (totpVerified) {
        return true;
      }

      // Try backup code
      const backupVerified = await this.verifyBackupCode(userId, token);
      return backupVerified;
    } catch (error) {
      logger.error('Error verifying token', error);
      return false;
    }
  }

  /**
   * Check if user has 2FA enabled
   */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true },
      });

      return user?.twoFactorEnabled || false;
    } catch (error) {
      logger.error('Error checking 2FA status', error);
      return false;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }

    return codes;
  }

  /**
   * Save hashed backup codes to database
   */
  private async saveBackupCodes(userId: string, codes: string[]): Promise<void> {
    const hashedCodes = await Promise.all(
      codes.map(async (code) => ({
        userId,
        code: await hashPassword(code),
      }))
    );

    await prisma.twoFactorBackupCode.createMany({
      data: hashedCodes,
    });
  }

  /**
   * Derive encryption key for 2FA secret storage.
   * FIPS 140-3 compliant: PBKDF2-SHA256 key derivation.
   */
  private deriveEncryptionKey(): Buffer {
    if (!process.env.ENCRYPTION_KEY) {
      throw new AppError('ENCRYPTION_KEY environment variable is required for 2FA encryption', 400);
    }
    const salt = crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY).digest().subarray(0, 16);
    // FIPS 140-3 compliant: PBKDF2-SHA256 (SP 800-132)
    return crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
  }

  /**
   * Encrypt secret for storage using AES-256-GCM.
   * FIPS 140-3: Migrated from AES-256-CBC to AES-256-GCM for authenticated encryption.
   * Output format: iv(24 hex):authTag(32 hex):ciphertext(hex)
   */
  private encryptSecret(secret: string): string {
    const key = this.deriveEncryptionKey();
    try {
      const iv = crypto.randomBytes(12); // 12 bytes (96 bits) is standard for GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } finally {
      key.fill(0); // FIPS 140-3 key zeroization
    }
  }

  /**
   * Decrypt secret from storage.
   * Supports both new AES-256-GCM format (3 parts) and legacy AES-256-CBC (2 parts)
   * for backward compatibility during migration.
   */
  private decryptSecret(encryptedSecret: string): string {
    const key = this.deriveEncryptionKey();
    try {
      const parts = encryptedSecret.split(':');

      if (parts.length === 3) {
        // New GCM format: iv:authTag:ciphertext
        const [ivHex, authTagHex, ciphertext] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } else if (parts.length === 2) {
        // Legacy CBC format: iv:ciphertext (backward compatibility)
        const [ivHex, encrypted] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      }

      throw new AppError('Invalid encrypted secret format', 400);
    } finally {
      key.fill(0); // FIPS 140-3 key zeroization
    }
  }
}

export default new TwoFactorService();
