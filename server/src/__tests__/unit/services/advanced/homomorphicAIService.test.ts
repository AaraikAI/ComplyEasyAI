/**
 * Homomorphic AI Service Unit Tests
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { prismaMock } from '../../../mocks/prisma';

const mockPublicKey = {
  save: jest.fn() as jest.Mock<any>,
  load: jest.fn(),
};
const mockSecretKey = {
  save: jest.fn() as jest.Mock<any>,
  load: jest.fn(),
};
const mockRelinKeys = {
  save: jest.fn() as jest.Mock<any>,
  load: jest.fn(),
};
const mockGaloisKeys = {
  save: jest.fn() as jest.Mock<any>,
  load: jest.fn(),
};
const mockCiphertext = {
  save: jest.fn() as jest.Mock<any>,
  load: jest.fn(),
  copy: jest.fn(),
  invariantNoiseBudget: jest.fn() as jest.Mock<any>,
};
const mockPlaintext = {
  toBigInt: jest.fn() as jest.Mock<any>,
};

// Mock node-seal as a function
const nodeSealFn = jest.fn() as jest.Mock<any>;
jest.mock('node-seal', () => nodeSealFn, { virtual: true });

jest.mock('../../../../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../../../../config/database', () => ({
  __esModule: true,
  default: prismaMock,
}));

import homomorphicAIService from '../../../../services/advanced/homomorphicAIService';

function setupNodeSealMocks() {
  mockPublicKey.save.mockReturnValue('public-key');
  mockSecretKey.save.mockReturnValue('secret-key');
  mockRelinKeys.save.mockReturnValue('relin-keys');
  mockGaloisKeys.save.mockReturnValue('galois-keys');
  mockCiphertext.save.mockReturnValue('encrypted-data');
  mockCiphertext.invariantNoiseBudget.mockReturnValue(100);
  mockPlaintext.toBigInt.mockReturnValue(BigInt(100));

  nodeSealFn.mockResolvedValue({
    SchemeType: {
      bfv: 'bfv',
      ckks: 'ckks',
    },
    SecurityLevel: {
      tc128: 128,
      tc192: 192,
      tc256: 256,
    },
    EncryptionParameters: jest.fn<any>().mockImplementation(() => ({
      setPolyModulusDegree: jest.fn(),
      setCoeffModulus: jest.fn(),
      setPlainModulus: jest.fn(),
    })),
    CoeffModulus: {
      BFVDefault: jest.fn<any>().mockReturnValue([]),
      Create: jest.fn<any>().mockReturnValue([]),
    },
    PlainModulus: {
      Batching: jest.fn<any>().mockReturnValue(1024),
    },
    Context: jest.fn<any>().mockImplementation(() => ({
      parameters: {},
      parametersSet: jest.fn<any>().mockReturnValue(true),
    })),
    PublicKey: jest.fn<any>().mockImplementation(() => mockPublicKey),
    SecretKey: jest.fn<any>().mockImplementation(() => mockSecretKey),
    RelinKeys: jest.fn<any>().mockImplementation(() => mockRelinKeys),
    GaloisKeys: jest.fn<any>().mockImplementation(() => mockGaloisKeys),
    CipherText: jest.fn<any>().mockImplementation(() => mockCiphertext),
    PlainText: jest.fn<any>().mockImplementation(() => mockPlaintext),
    KeyGenerator: jest.fn<any>().mockImplementation(() => ({
      createPublicKey: jest.fn<any>().mockReturnValue(mockPublicKey),
      secretKey: jest.fn<any>().mockReturnValue(mockSecretKey),
      createRelinKeys: jest.fn<any>().mockReturnValue(mockRelinKeys),
      createGaloisKeys: jest.fn<any>().mockReturnValue(mockGaloisKeys),
    })),
    Encryptor: jest.fn<any>().mockImplementation(() => ({
      setPublicKey: jest.fn(),
      encrypt: jest.fn(),
    })),
    Decryptor: jest.fn<any>().mockImplementation(() => ({
      setSecretKey: jest.fn(),
      decrypt: jest.fn(),
    })),
    Evaluator: jest.fn<any>().mockImplementation(() => ({
      add: jest.fn(),
      addPlain: jest.fn(),
      multiply: jest.fn(),
      multiplyPlain: jest.fn(),
      square: jest.fn(),
      relinearize: jest.fn(),
      rescaleToNext: jest.fn(),
      rotateVector: jest.fn(),
    })),
    BatchEncoder: jest.fn<any>().mockImplementation(() => ({
      encode: jest.fn(),
      decode: jest.fn<any>().mockReturnValue([1, 2, 3]),
    })),
    CKKSEncoder: jest.fn<any>().mockImplementation(() => ({
      encode: jest.fn(),
      decode: jest.fn<any>().mockReturnValue([1.5, 2.5, 3.5]),
    })),
  });
}

describe('HomomorphicAIService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupNodeSealMocks();
    // Reset internal SEAL state
    (homomorphicAIService as any).seal = null;
    (homomorphicAIService as any).initialized = false;
  });

  describe('initialize()', () => {
    it('should initialize SEAL library', async () => {
      await expect(homomorphicAIService.initialize()).resolves.not.toThrow();
    });
  });

  describe('generateKeys()', () => {
    it('should generate keys for BFV scheme', async () => {
      await homomorphicAIService.initialize();

      const result = await homomorphicAIService.generateKeys('BFV', 128);

      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('secretKey');
      expect(result).toHaveProperty('relinKeys');
    });

    it('should generate keys for CKKS scheme', async () => {
      await homomorphicAIService.initialize();

      const result = await homomorphicAIService.generateKeys('CKKS', 128);

      expect(result).toHaveProperty('publicKey');
      expect(result).toHaveProperty('secretKey');
      expect(result).toHaveProperty('relinKeys');
      expect(result).toHaveProperty('galoisKeys');
    });
  });

  describe('encryptData()', () => {
    it('should encrypt data using BFV scheme', async () => {
      await homomorphicAIService.initialize();
      const keys = await homomorphicAIService.generateKeys('BFV');

      const data = [1, 2, 3, 4];
      const result = await homomorphicAIService.encryptData(data, keys.publicKey, 'BFV');

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('scheme', 'BFV');
    });

    it('should encrypt data using CKKS scheme', async () => {
      await homomorphicAIService.initialize();
      const keys = await homomorphicAIService.generateKeys('CKKS');

      const data = [1.5, 2.5, 3.5, 4.5];
      const result = await homomorphicAIService.encryptData(data, keys.publicKey, 'CKKS');

      expect(result).toHaveProperty('ciphertext');
      expect(result).toHaveProperty('scheme', 'CKKS');
    });
  });

  describe('decryptData()', () => {
    it('should decrypt data using BFV scheme', async () => {
      await homomorphicAIService.initialize();
      const keys = await homomorphicAIService.generateKeys('BFV');

      const encryptedData = {
        ciphertext: 'encrypted-data',
        contextParams: {
          polyModulusDegree: 8192,
          coeffModulusBitSizes: [40, 40, 40],
          plainModulusBitSize: 20,
        },
        scheme: 'BFV' as const,
      };

      const result = await homomorphicAIService.decryptData(
        encryptedData,
        keys.secretKey
      );

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('encryptedLinearRegression()', () => {
    it('should perform linear regression on encrypted data', async () => {
      await homomorphicAIService.initialize();
      const keys = await homomorphicAIService.generateKeys('CKKS');

      const encryptedX = {
        ciphertext: 'encrypted-x',
        contextParams: {
          polyModulusDegree: 8192,
          coeffModulusBitSizes: [40, 40, 40],
          scale: 2 ** 40,
        },
        scheme: 'CKKS' as const,
      };

      const result = await homomorphicAIService.encryptedLinearRegression(
        encryptedX,
        [1.0, 2.0, 3.0],
        keys.publicKey,
        keys.relinKeys
      );

      expect(result).toHaveProperty('encryptedResult');
      expect(result).toHaveProperty('metadata');
    });
  });

  describe('encryptedStatistics()', () => {
    it('should compute statistics on encrypted data', async () => {
      await homomorphicAIService.initialize();
      const keys = await homomorphicAIService.generateKeys('CKKS');

      const encryptedData = {
        ciphertext: 'encrypted-data',
        contextParams: {
          polyModulusDegree: 8192,
          coeffModulusBitSizes: [40, 40, 40],
          scale: 2 ** 40,
        },
        scheme: 'CKKS' as const,
      };

      const result = await homomorphicAIService.encryptedStatistics(
        encryptedData,
        keys.galoisKeys,
        keys.relinKeys
      );

      expect(result).toHaveProperty('encryptedMean');
      expect(result).toHaveProperty('encryptedVariance');
    });
  });
});
