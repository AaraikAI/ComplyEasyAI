/**
 * Module augmentations for packages with incomplete or outdated type definitions.
 * This file MUST have at least one import/export to be treated as a module
 * (required for augmentation rather than replacement).
 */
export {};

// Augment @tensorflow/tfjs with members missing from current type definitions.
// @tensorflow/tfjs-core@4.22 lists `dist/index.d.ts` in its package.json `types`
// field but the file is not present in the published tarball, so the upstream
// re-export from @tensorflow/tfjs is empty. The runtime API still works; we
// declare the subset that this codebase actually uses.
declare module '@tensorflow/tfjs' {
  export interface LayersModel {
    predict(inputs: any): any;
    compile(config: any): void;
    fit(x: any, y: any, config?: any): Promise<any>;
    save(path: string): Promise<any>;
    getWeights(): any[];
    setWeights(weights: any[]): void;
    add(layer: any): void;
    summary(): void;
    layers: any[];
  }

  // Tensor + value type aliases. We declare the readback methods explicitly so
  // chained calls like Array.from(tensor.dataSync()) infer number[] instead of
  // unknown[], while leaving the rest of the surface as any for ergonomics.
  export interface Tensor {
    shape: number[];
    rank: number;
    size: number;
    dtype: string;
    dataSync(): Float32Array;
    data(): Promise<Float32Array>;
    arraySync(): any;
    array(): Promise<any>;
    dispose(): void;
    print(): void;
    [key: string]: any;
  }
  export type Tensor1D = Tensor;
  export type Tensor2D = Tensor;
  export type Tensor3D = Tensor;
  export type Tensor4D = Tensor;
  export type Scalar = Tensor;
  export type Variable = Tensor;
  export type Optimizer = any;

  // Tensor + math ops. Returning Tensor (not any) lets downstream chained calls
  // like Array.from(result.dataSync()) infer number[] instead of unknown[].
  export const tensor: (...args: any[]) => Tensor;
  export const tensor1d: (...args: any[]) => Tensor;
  export const tensor2d: (...args: any[]) => Tensor;
  export const tensor3d: (...args: any[]) => Tensor;
  export const tensor4d: (...args: any[]) => Tensor;
  export const variable: (...args: any[]) => Variable;
  export const zeros: (...args: any[]) => Tensor;
  export const ones: (...args: any[]) => Tensor;
  export const eye: (...args: any[]) => Tensor;
  export const diag: (...args: any[]) => Tensor;
  export const oneHot: (...args: any[]) => Tensor;
  export const randomUniform: (...args: any[]) => Tensor;
  export const randomNormal: (...args: any[]) => Tensor;
  export const add: (a: Tensor | number, b: Tensor | number) => Tensor;
  export const sub: (a: Tensor | number, b: Tensor | number) => Tensor;
  export const mul: (a: Tensor | number, b: Tensor | number) => Tensor;
  export const div: (a: Tensor | number, b: Tensor | number) => Tensor;
  export const neg: (a: Tensor) => Tensor;
  export const log: (a: Tensor) => Tensor;
  export const matMul: (a: Tensor, b: Tensor, ...rest: any[]) => Tensor;
  export const mean: (...args: any[]) => Tensor;
  export const sum: (...args: any[]) => Tensor;
  export const norm: (...args: any[]) => Tensor;
  export const greater: (...args: any[]) => Tensor;
  export const where: (...args: any[]) => Tensor;
  export const dropout: (...args: any[]) => Tensor;
  export const relu: (...args: any[]) => Tensor;
  export const softmax: (...args: any[]) => Tensor;
  export const tidy: <T>(fn: () => T) => T;

  // Engine + backend management
  export const engine: any;
  export const setBackend: (backend: string) => Promise<boolean>;
  export const ready: () => Promise<void>;

  export function sequential(config?: any): LayersModel;
  export function loadLayersModel(path: string): Promise<LayersModel>;

  export namespace layers {
    function dense(config: any): any;
    function dropout(config: any): any;
    function conv2d(config: any): any;
    function maxPooling2d(config: any): any;
    function flatten(config?: any): any;
    function batchNormalization(config?: any): any;
    function lstm(config: any): any;
    function embedding(config: any): any;
    function globalAveragePooling2d(config?: any): any;
  }

  export namespace regularizers {
    function l2(config?: any): any;
    function l1(config?: any): any;
    function l1l2(config?: any): any;
  }

  export namespace train {
    function adam(learningRate?: number, beta1?: number, beta2?: number, epsilon?: number): any;
    function sgd(learningRate: number): any;
    function rmsprop(learningRate?: number): any;
    function adagrad(learningRate?: number): any;
  }

  export namespace losses {
    function meanSquaredError(labels: any, predictions: any): any;
    function softmaxCrossEntropy(labels: any, predictions: any): any;
    function sigmoidCrossEntropy(labels: any, predictions: any): any;
    function absoluteDifference(labels: any, predictions: any): any;
  }

  export interface TrainingLogs {
    loss: number;
    acc?: number;
    val_loss?: number;
    val_acc?: number;
    [key: string]: any;
  }
}
