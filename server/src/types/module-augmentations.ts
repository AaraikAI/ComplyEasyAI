/**
 * Module augmentations for packages with incomplete or outdated type definitions.
 * This file MUST have at least one import/export to be treated as a module
 * (required for augmentation rather than replacement).
 */
export {};

// Augment @tensorflow/tfjs with members missing from current type definitions.
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

  export interface TrainingLogs {
    loss: number;
    acc?: number;
    val_loss?: number;
    val_acc?: number;
    [key: string]: any;
  }
}
