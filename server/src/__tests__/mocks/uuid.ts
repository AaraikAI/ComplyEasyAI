/**
 * UUID Mock for Jest tests
 * Provides a deterministic UUID mock to avoid ESM import issues with uuid v13+
 */

let counter = 0;

export const v4 = () => {
  counter++;
  return `test-uuid-${counter.toString().padStart(4, '0')}`;
};

export const v1 = () => `test-uuid-v1-${Date.now()}`;
export const v3 = () => 'test-uuid-v3';
export const v5 = () => 'test-uuid-v5';
export const v6 = () => 'test-uuid-v6';
export const v7 = () => 'test-uuid-v7';

export const NIL = '00000000-0000-0000-0000-000000000000';
export const MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

export const validate = (uuid: string) => {
  return typeof uuid === 'string' && uuid.length > 0;
};

export const version = (uuid: string) => 4;
export const stringify = (arr: Uint8Array) => 'test-uuid-stringify';
export const parse = (uuid: string) => new Uint8Array(16);

export default { v4, v1, v3, v5, v6, v7, NIL, MAX, validate, version, stringify, parse };
