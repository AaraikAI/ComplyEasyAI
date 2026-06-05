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

declare module 'ethers' {
  export interface Log { topics: string[]; data: string; address: string; transactionHash: string; blockNumber: number; }
  export class EventLog implements Log {
    args: any[]; fragment: any; eventName: string;
    topics: string[]; data: string; address: string; transactionHash: string; blockNumber: number;
  }
  export interface TransactionReceipt { hash: string; blockNumber: number; gasUsed: bigint; gasPrice: bigint; status: number; logs: Log[]; }
  export interface ContractTransactionResponse { hash: string; wait(confirmations?: number): Promise<TransactionReceipt>; }
  export interface Overrides { gasLimit?: bigint | number; gasPrice?: bigint; maxFeePerGas?: bigint; maxPriorityFeePerGas?: bigint; nonce?: number; value?: bigint; }
  export interface FeeData { gasPrice: bigint | null; maxFeePerGas: bigint | null; maxPriorityFeePerGas: bigint | null; }
  export interface Block { number: number; timestamp: number; hash: string; parentHash: string; }

  export class JsonRpcProvider {
    constructor(url?: string, network?: any);
    getBlockNumber(): Promise<number>;
    getNetwork(): Promise<{ chainId: bigint; name: string }>;
    getCode(address: string): Promise<string>;
    getBalance(address: string): Promise<bigint>;
    getBlock(blockHashOrNumber: string | number): Promise<Block | null>;
    getTransaction(hash: string): Promise<any>;
    getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
    getFeeData(): Promise<FeeData>;
    estimateGas(tx: any): Promise<bigint>;
    destroy(): void;
  }
  export class Wallet {
    constructor(privateKey: string, provider?: any);
    address: string;
    getNonce(blockTag?: string): Promise<number>;
    sendTransaction(tx: any): Promise<ContractTransactionResponse>;
    connect(provider: JsonRpcProvider): Wallet;
  }
  export class Contract {
    constructor(address: string, abi: any[], signerOrProvider: any);
    [key: string]: any;
  }
  export class ContractFactory {
    constructor(abi: any[], bytecode: string, signer: any);
    deploy(...args: any[]): Promise<any>;
    getDeployTransaction(...args: any[]): any;
  }
  export function parseEther(value: string): bigint;
  export function formatEther(value: bigint): string;
  export function formatUnits(value: bigint | number, unit?: string | number): string;
  export function keccak256(data: any): string;
  export function toUtf8Bytes(text: string): Uint8Array;
  export function getAddress(address: string): string;
  export function isAddress(address: string): boolean;
  export function zeroPadValue(value: any, length: number): string;
  export function hexlify(data: any): string;

  export namespace ethers {
    export type EventLog = import('ethers').EventLog;
    export const EventLog: typeof import('ethers').EventLog;
    export type Log = import('ethers').Log;
    export type TransactionReceipt = import('ethers').TransactionReceipt;
    export type ContractTransactionResponse = import('ethers').ContractTransactionResponse;
    export type Overrides = import('ethers').Overrides;
    export type FeeData = import('ethers').FeeData;
    export type Block = import('ethers').Block;
    export class JsonRpcProvider {
      constructor(url?: string, network?: any);
      getBlockNumber(): Promise<number>;
      getNetwork(): Promise<{ chainId: bigint; name: string }>;
      getCode(address: string): Promise<string>;
      getBalance(address: string): Promise<bigint>;
      getBlock(blockHashOrNumber: string | number): Promise<Block | null>;
      getTransaction(hash: string): Promise<any>;
      getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>;
      getFeeData(): Promise<FeeData>;
      estimateGas(tx: any): Promise<bigint>;
      destroy(): void;
    }
    export class Wallet {
      constructor(privateKey: string, provider?: any);
      address: string;
      getNonce(blockTag?: string): Promise<number>;
      sendTransaction(tx: any): Promise<ContractTransactionResponse>;
      connect(provider: JsonRpcProvider): Wallet;
    }
    export class Contract {
      constructor(address: string, abi: any[], signerOrProvider: any);
      [key: string]: any;
    }
    export class ContractFactory {
      constructor(abi: any[], bytecode: string, signer: any);
      deploy(...args: any[]): Promise<any>;
      getDeployTransaction(...args: any[]): any;
    }
    export function parseEther(value: string): bigint;
    export function formatEther(value: bigint): string;
    export function formatUnits(value: bigint | number, unit?: string | number): string;
    export function keccak256(data: any): string;
    export function toUtf8Bytes(text: string): Uint8Array;
    export function getAddress(address: string): string;
    export function isAddress(address: string): boolean;
    export function zeroPadValue(value: any, length: number): string;
    export function hexlify(data: any): string;
  }
}

declare module 'rate-limit-redis' {
  import type { Store } from 'express-rate-limit';
  interface RedisStoreOptions {
    sendCommand: (...args: string[]) => unknown;
    prefix?: string;
  }
  export default class RedisStore implements Store {
    constructor(options: RedisStoreOptions);
    init(options: any): void;
    increment(key: string): Promise<{ totalHits: number; resetTime: Date }>;
    decrement(key: string): Promise<void>;
    resetKey(key: string): Promise<void>;
  }
}

declare module 'circomlibjs' {
  export interface PoseidonField {
    toObject(value: unknown): bigint;
    e(value: unknown): unknown;
  }
  export interface Poseidon {
    (inputs: Array<bigint | number | string>): unknown;
    F: PoseidonField;
  }
  export function buildPoseidon(): Promise<Poseidon>;
}
