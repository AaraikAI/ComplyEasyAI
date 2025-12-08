/**
 * Type declarations for external modules without TypeScript definitions
 */

declare module 'snarkjs' {
  export const groth16: {
    fullProve: (
      input: Record<string, unknown>,
      wasmFile: string,
      zkeyFile: string
    ) => Promise<{ proof: unknown; publicSignals: unknown[] }>;
    verify: (
      vKey: unknown,
      publicSignals: unknown[],
      proof: unknown
    ) => Promise<boolean>;
  };
  export const zKey: {
    newZKey: (
      r1cs: string,
      ptau: string,
      zkey: string,
      logger?: unknown
    ) => Promise<void>;
  };
}

declare module 'node-seal' {
  const SEAL: () => Promise<{
    EncryptionParameters: new (schemeType: unknown) => unknown;
    SchemeType: {
      bfv: unknown;
      ckks: unknown;
    };
    Context: (params: unknown) => unknown;
    KeyGenerator: (context: unknown) => {
      publicKey: () => unknown;
      secretKey: () => unknown;
    };
    Evaluator: (context: unknown) => unknown;
    Encryptor: (context: unknown, publicKey: unknown) => unknown;
    Decryptor: (context: unknown, secretKey: unknown) => unknown;
    BatchEncoder: (context: unknown) => unknown;
    IntegerEncoder: (context: unknown) => unknown;
    PlainText: () => unknown;
    CipherText: () => unknown;
  }>;
  export = SEAL;
}
