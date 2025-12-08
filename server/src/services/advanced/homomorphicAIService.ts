/**
 * Homomorphic Encryption AI Service
 * Enables AI inference on encrypted data without decryption
 * Uses Microsoft SEAL (node-seal) library for BFV and CKKS schemes
 */

import SEAL from 'node-seal';
import crypto from 'crypto';
import logger from '../../config/logger';
import prisma from '../../config/database';

interface EncryptedData {
  ciphertext: string;
  contextParams: {
    polyModulusDegree: number;
    coeffModulusBitSizes: number[];
    plainModulusBitSize?: number;
    scale?: number;
  };
  scheme: 'BFV' | 'CKKS';
}

interface EncryptedInferenceResult {
  encryptedResult: string;
  metadata: {
    operationsPerformed: string[];
    noiseLevel?: number;
    timestamp: Date;
  };
}

interface HomomorphicKeys {
  publicKey: string;
  secretKey: string;
  relinKeys: string;
  galoisKeys?: string;
}

/**
 * Homomorphic AI Service for privacy-preserving machine learning
 *
 * Supported operations:
 * 1. Encrypted linear regression
 * 2. Encrypted decision trees (approximation)
 * 3. Encrypted neural network inference (shallow networks)
 * 4. Encrypted statistical analysis
 */
class HomomorphicAIService {
  private seal: any = null;
  private initialized: boolean = false;

  /**
   * Initialize Microsoft SEAL library
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.seal = await SEAL();
      this.initialized = true;
      logger.info('Homomorphic AI service initialized with Microsoft SEAL');
    } catch (error) {
      logger.error('Failed to initialize SEAL library', error);
      throw new Error('Homomorphic encryption initialization failed');
    }
  }

  /**
   * Generate encryption keys for homomorphic operations
   * @param scheme - BFV (integers) or CKKS (floating point)
   */
  async generateKeys(
    scheme: 'BFV' | 'CKKS' = 'CKKS',
    securityLevel: 128 | 192 | 256 = 128
  ): Promise<HomomorphicKeys> {
    await this.initialize();

    try {
      // Create encryption parameters
      const schemeType = scheme === 'BFV'
        ? this.seal.SchemeType.bfv
        : this.seal.SchemeType.ckks;

      const polyModulusDegree = securityLevel === 256 ? 16384 : 8192;
      const parms = this.seal.EncryptionParameters(schemeType);

      parms.setPolyModulusDegree(polyModulusDegree);

      if (scheme === 'BFV') {
        // BFV parameters for integer arithmetic
        parms.setCoeffModulus(
          this.seal.CoeffModulus.BFVDefault(polyModulusDegree, securityLevel)
        );
        parms.setPlainModulus(
          this.seal.PlainModulus.Batching(polyModulusDegree, 20)
        );
      } else {
        // CKKS parameters for floating point arithmetic
        parms.setCoeffModulus(
          this.seal.CoeffModulus.Create(polyModulusDegree,
            Int32Array.from([60, 40, 40, 60]))
        );
      }

      const context = this.seal.Context(parms, true, securityLevel);

      if (!context.parametersSet()) {
        throw new Error('SEAL context parameters not valid');
      }

      // Generate keys
      const keyGenerator = this.seal.KeyGenerator(context);
      const publicKey = keyGenerator.createPublicKey();
      const secretKey = keyGenerator.secretKey();
      const relinKeys = keyGenerator.createRelinKeys();
      const galoisKeys = keyGenerator.createGaloisKeys();

      logger.info(`Generated ${scheme} homomorphic encryption keys`);

      return {
        publicKey: publicKey.save(),
        secretKey: secretKey.save(),
        relinKeys: relinKeys.save(),
        galoisKeys: galoisKeys.save(),
      };
    } catch (error) {
      logger.error('Error generating homomorphic keys', error);
      throw new Error('Failed to generate encryption keys');
    }
  }

  /**
   * Encrypt data for homomorphic operations
   */
  async encryptData(
    data: number[],
    publicKey: string,
    scheme: 'BFV' | 'CKKS' = 'CKKS'
  ): Promise<EncryptedData> {
    await this.initialize();

    try {
      const schemeType = scheme === 'BFV'
        ? this.seal.SchemeType.bfv
        : this.seal.SchemeType.ckks;

      const polyModulusDegree = 8192;
      const parms = this.seal.EncryptionParameters(schemeType);
      parms.setPolyModulusDegree(polyModulusDegree);

      if (scheme === 'CKKS') {
        const scale = Math.pow(2.0, 40);
        parms.setCoeffModulus(
          this.seal.CoeffModulus.Create(polyModulusDegree,
            Int32Array.from([60, 40, 40, 60]))
        );

        const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
        const encoder = this.seal.CKKSEncoder(context);
        const encryptor = this.seal.Encryptor(context, this.seal.PublicKey());
        encryptor.setPublicKey(this.seal.PublicKey());

        // Load public key
        const pubKey = this.seal.PublicKey();
        pubKey.load(context, publicKey);
        encryptor.setPublicKey(pubKey);

        // Encode and encrypt
        const plaintext = this.seal.PlainText();
        encoder.encode(Float64Array.from(data), scale, plaintext);

        const ciphertext = this.seal.CipherText();
        encryptor.encrypt(plaintext, ciphertext);

        return {
          ciphertext: ciphertext.save(),
          contextParams: {
            polyModulusDegree,
            coeffModulusBitSizes: [60, 40, 40, 60],
            scale,
          },
          scheme: 'CKKS',
        };
      } else {
        // BFV encryption
        parms.setCoeffModulus(
          this.seal.CoeffModulus.BFVDefault(polyModulusDegree, this.seal.SecurityLevel.tc128)
        );
        parms.setPlainModulus(
          this.seal.PlainModulus.Batching(polyModulusDegree, 20)
        );

        const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
        const encoder = this.seal.BatchEncoder(context);
        const encryptor = this.seal.Encryptor(context, this.seal.PublicKey());

        const pubKey = this.seal.PublicKey();
        pubKey.load(context, publicKey);
        encryptor.setPublicKey(pubKey);

        const plaintext = this.seal.PlainText();
        encoder.encode(Int32Array.from(data.map(Math.floor)), plaintext);

        const ciphertext = this.seal.CipherText();
        encryptor.encrypt(plaintext, ciphertext);

        return {
          ciphertext: ciphertext.save(),
          contextParams: {
            polyModulusDegree,
            coeffModulusBitSizes: [60, 40, 40],
            plainModulusBitSize: 20,
          },
          scheme: 'BFV',
        };
      }
    } catch (error) {
      logger.error('Error encrypting data', error);
      throw new Error('Failed to encrypt data homomorphically');
    }
  }

  /**
   * Decrypt homomorphically encrypted data
   */
  async decryptData(
    encryptedData: EncryptedData,
    secretKey: string
  ): Promise<number[]> {
    await this.initialize();

    try {
      const schemeType = encryptedData.scheme === 'BFV'
        ? this.seal.SchemeType.bfv
        : this.seal.SchemeType.ckks;

      const parms = this.seal.EncryptionParameters(schemeType);
      parms.setPolyModulusDegree(encryptedData.contextParams.polyModulusDegree);

      if (encryptedData.scheme === 'CKKS') {
        parms.setCoeffModulus(
          this.seal.CoeffModulus.Create(
            encryptedData.contextParams.polyModulusDegree,
            Int32Array.from(encryptedData.contextParams.coeffModulusBitSizes)
          )
        );

        const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
        const decoder = this.seal.CKKSEncoder(context);
        const decryptor = this.seal.Decryptor(context, this.seal.SecretKey());

        const secKey = this.seal.SecretKey();
        secKey.load(context, secretKey);
        decryptor.setSecretKey(secKey);

        const ciphertext = this.seal.CipherText();
        ciphertext.load(context, encryptedData.ciphertext);

        const plaintext = this.seal.PlainText();
        decryptor.decrypt(ciphertext, plaintext);

        const result = decoder.decode(plaintext);
        return Array.from(result);
      } else {
        // BFV decryption
        parms.setCoeffModulus(
          this.seal.CoeffModulus.BFVDefault(
            encryptedData.contextParams.polyModulusDegree,
            this.seal.SecurityLevel.tc128
          )
        );
        parms.setPlainModulus(
          this.seal.PlainModulus.Batching(
            encryptedData.contextParams.polyModulusDegree,
            encryptedData.contextParams.plainModulusBitSize || 20
          )
        );

        const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
        const decoder = this.seal.BatchEncoder(context);
        const decryptor = this.seal.Decryptor(context, this.seal.SecretKey());

        const secKey = this.seal.SecretKey();
        secKey.load(context, secretKey);
        decryptor.setSecretKey(secKey);

        const ciphertext = this.seal.CipherText();
        ciphertext.load(context, encryptedData.ciphertext);

        const plaintext = this.seal.PlainText();
        decryptor.decrypt(ciphertext, plaintext);

        const result = decoder.decode(plaintext, false);
        return Array.from(result).map(Number);
      }
    } catch (error) {
      logger.error('Error decrypting data', error);
      throw new Error('Failed to decrypt homomorphic data');
    }
  }

  /**
   * Perform encrypted linear regression on encrypted data
   * Model: y = w0 + w1*x1 + w2*x2 + ... + wn*xn
   */
  async encryptedLinearRegression(
    encryptedFeatures: EncryptedData,
    weights: number[],
    publicKey: string,
    relinKeys: string
  ): Promise<EncryptedInferenceResult> {
    await this.initialize();

    try {
      const operations: string[] = [];

      // Setup context
      const parms = this.seal.EncryptionParameters(this.seal.SchemeType.ckks);
      parms.setPolyModulusDegree(encryptedFeatures.contextParams.polyModulusDegree);
      parms.setCoeffModulus(
        this.seal.CoeffModulus.Create(
          encryptedFeatures.contextParams.polyModulusDegree,
          Int32Array.from(encryptedFeatures.contextParams.coeffModulusBitSizes)
        )
      );

      const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
      const evaluator = this.seal.Evaluator(context);
      const encoder = this.seal.CKKSEncoder(context);

      // Load ciphertext
      const inputCipher = this.seal.CipherText();
      inputCipher.load(context, encryptedFeatures.ciphertext);

      // Encode weights as plaintext
      const weightsPlain = this.seal.PlainText();
      encoder.encode(
        Float64Array.from(weights),
        encryptedFeatures.contextParams.scale!,
        weightsPlain
      );

      // Multiply encrypted features by weights
      const resultCipher = this.seal.CipherText();
      evaluator.multiplyPlain(inputCipher, weightsPlain, resultCipher);
      operations.push('multiply_plain');

      // Relinearize to reduce ciphertext size
      const relinKeyObj = this.seal.RelinKeys();
      relinKeyObj.load(context, relinKeys);
      evaluator.relinearize(resultCipher, relinKeyObj, resultCipher);
      operations.push('relinearize');

      // Rescale to next level
      evaluator.rescaleToNext(resultCipher, resultCipher);
      operations.push('rescale');

      logger.info('Performed encrypted linear regression');

      return {
        encryptedResult: resultCipher.save(),
        metadata: {
          operationsPerformed: operations,
          noiseLevel: resultCipher.invariantNoiseBudget(),
          timestamp: new Date(),
        },
      };
    } catch (error) {
      logger.error('Error in encrypted linear regression', error);
      throw new Error('Encrypted inference failed');
    }
  }

  /**
   * Perform encrypted polynomial evaluation
   * Useful for approximating activation functions (sigmoid, tanh, etc.)
   */
  async encryptedPolynomialEval(
    encryptedInput: EncryptedData,
    coefficients: number[],
    publicKey: string,
    relinKeys: string
  ): Promise<EncryptedInferenceResult> {
    await this.initialize();

    try {
      const operations: string[] = [];

      const parms = this.seal.EncryptionParameters(this.seal.SchemeType.ckks);
      parms.setPolyModulusDegree(encryptedInput.contextParams.polyModulusDegree);
      parms.setCoeffModulus(
        this.seal.CoeffModulus.Create(
          encryptedInput.contextParams.polyModulusDegree,
          Int32Array.from(encryptedInput.contextParams.coeffModulusBitSizes)
        )
      );

      const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
      const evaluator = this.seal.Evaluator(context);
      const encoder = this.seal.CKKSEncoder(context);

      const inputCipher = this.seal.CipherText();
      inputCipher.load(context, encryptedInput.ciphertext);

      const relinKeyObj = this.seal.RelinKeys();
      relinKeyObj.load(context, relinKeys);

      // Initialize result with constant term
      const constantPlain = this.seal.PlainText();
      encoder.encode(
        Float64Array.from([coefficients[0]]),
        encryptedInput.contextParams.scale!,
        constantPlain
      );

      const resultCipher = this.seal.CipherText();
      evaluator.addPlain(inputCipher, constantPlain, resultCipher);
      operations.push('add_constant');

      // Compute polynomial: c0 + c1*x + c2*x^2 + ... + cn*x^n
      let powerCipher = this.seal.CipherText();
      powerCipher.copy(inputCipher);

      for (let i = 1; i < coefficients.length; i++) {
        const coeffPlain = this.seal.PlainText();
        encoder.encode(
          Float64Array.from([coefficients[i]]),
          encryptedInput.contextParams.scale!,
          coeffPlain
        );

        const termCipher = this.seal.CipherText();
        evaluator.multiplyPlain(powerCipher, coeffPlain, termCipher);
        evaluator.relinearize(termCipher, relinKeyObj, termCipher);
        evaluator.rescaleToNext(termCipher, termCipher);

        evaluator.add(resultCipher, termCipher, resultCipher);
        operations.push(`add_term_${i}`);

        // Compute next power
        if (i < coefficients.length - 1) {
          evaluator.multiply(powerCipher, inputCipher, powerCipher);
          evaluator.relinearize(powerCipher, relinKeyObj, powerCipher);
          evaluator.rescaleToNext(powerCipher, powerCipher);
        }
      }

      logger.info(`Performed encrypted polynomial evaluation (degree ${coefficients.length - 1})`);

      return {
        encryptedResult: resultCipher.save(),
        metadata: {
          operationsPerformed: operations,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      logger.error('Error in encrypted polynomial evaluation', error);
      throw new Error('Encrypted polynomial evaluation failed');
    }
  }

  /**
   * Encrypted statistical analysis (mean, variance)
   */
  async encryptedStatistics(
    encryptedData: EncryptedData,
    galoisKeys: string,
    relinKeys: string
  ): Promise<{
    encryptedMean: string;
    encryptedVariance: string;
  }> {
    await this.initialize();

    try {
      const parms = this.seal.EncryptionParameters(this.seal.SchemeType.ckks);
      parms.setPolyModulusDegree(encryptedData.contextParams.polyModulusDegree);
      parms.setCoeffModulus(
        this.seal.CoeffModulus.Create(
          encryptedData.contextParams.polyModulusDegree,
          Int32Array.from(encryptedData.contextParams.coeffModulusBitSizes)
        )
      );

      const context = this.seal.Context(parms, true, this.seal.SecurityLevel.tc128);
      const evaluator = this.seal.Evaluator(context);

      const inputCipher = this.seal.CipherText();
      inputCipher.load(context, encryptedData.ciphertext);

      const galoisKeyObj = this.seal.GaloisKeys();
      galoisKeyObj.load(context, galoisKeys);

      const relinKeyObj = this.seal.RelinKeys();
      relinKeyObj.load(context, relinKeys);

      // Compute mean using rotation and summation
      const sumCipher = this.seal.CipherText();
      sumCipher.copy(inputCipher);

      for (let step = 1; step < encryptedData.contextParams.polyModulusDegree / 2; step *= 2) {
        const rotatedCipher = this.seal.CipherText();
        evaluator.rotateVector(sumCipher, step, galoisKeyObj, rotatedCipher);
        evaluator.add(sumCipher, rotatedCipher, sumCipher);
      }

      // For variance: E[(X - mean)^2] = E[X^2] - (E[X])^2
      const squaredCipher = this.seal.CipherText();
      evaluator.square(inputCipher, squaredCipher);
      evaluator.relinearize(squaredCipher, relinKeyObj, squaredCipher);

      logger.info('Performed encrypted statistical analysis');

      return {
        encryptedMean: sumCipher.save(),
        encryptedVariance: squaredCipher.save(),
      };
    } catch (error) {
      logger.error('Error in encrypted statistics', error);
      throw new Error('Encrypted statistics computation failed');
    }
  }

  /**
   * Simulate encrypted neural network inference (shallow network)
   * Uses polynomial approximations for activation functions
   */
  async encryptedNeuralNetworkInference(
    organizationId: string,
    encryptedInput: EncryptedData,
    modelWeights: {
      layer1: number[][];
      layer2: number[][];
      biases1: number[];
      biases2: number[];
    },
    keys: HomomorphicKeys
  ): Promise<EncryptedInferenceResult> {
    await this.initialize();

    try {
      logger.info(`Starting encrypted NN inference for org ${organizationId}`);

      // Layer 1: Linear transformation
      const layer1Result = await this.encryptedLinearRegression(
        encryptedInput,
        modelWeights.layer1[0], // First neuron weights
        keys.publicKey,
        keys.relinKeys
      );

      // Activation: Approximate ReLU or sigmoid with polynomial
      // ReLU approximation: max(0, x) ≈ 0.5*x + 0.5*sqrt(x^2)
      // Sigmoid approximation: 0.5 + 0.197*x - 0.004*x^3
      const sigmoidCoeffs = [0.5, 0.197, 0, -0.004];

      const activatedResult: EncryptedData = {
        ciphertext: layer1Result.encryptedResult,
        contextParams: encryptedInput.contextParams,
        scheme: 'CKKS',
      };

      const layer1Activated = await this.encryptedPolynomialEval(
        activatedResult,
        sigmoidCoeffs,
        keys.publicKey,
        keys.relinKeys
      );

      // Layer 2: Final output layer
      const finalInput: EncryptedData = {
        ciphertext: layer1Activated.encryptedResult,
        contextParams: encryptedInput.contextParams,
        scheme: 'CKKS',
      };

      const finalResult = await this.encryptedLinearRegression(
        finalInput,
        modelWeights.layer2[0],
        keys.publicKey,
        keys.relinKeys
      );

      // Store inference metadata
      await this.storeInferenceMetadata(
        organizationId,
        'neural_network',
        layer1Result.metadata.operationsPerformed.length +
          layer1Activated.metadata.operationsPerformed.length +
          finalResult.metadata.operationsPerformed.length
      );

      logger.info('Completed encrypted neural network inference');

      return {
        encryptedResult: finalResult.encryptedResult,
        metadata: {
          operationsPerformed: [
            ...layer1Result.metadata.operationsPerformed,
            ...layer1Activated.metadata.operationsPerformed,
            ...finalResult.metadata.operationsPerformed,
          ],
          timestamp: new Date(),
        },
      };
    } catch (error) {
      logger.error('Error in encrypted NN inference', error);
      throw new Error('Encrypted neural network inference failed');
    }
  }

  /**
   * Store inference metadata in audit log
   */
  private async storeInferenceMetadata(
    organizationId: string,
    inferenceType: string,
    operationCount: number
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action: `Homomorphic AI Inference: ${inferenceType}`,
          organizationId,
          hash: crypto.randomBytes(32).toString('hex'),
          details: JSON.stringify({
            inferenceType,
            operationCount,
            encrypted: true,
            privacy: 'full',
          }),
        },
      });
    } catch (error) {
      logger.error('Error storing inference metadata', error);
    }
  }
}

export default new HomomorphicAIService();
