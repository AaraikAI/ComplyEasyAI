import { describe, it, expect } from '@jest/globals';
import { isSafeObjectKey, isSafeSortField, MAX_OBJECT_KEY_LENGTH } from '../../../utils/safeObjectKey';
import { validatePaginationParams } from '../../../utils/pagination';

describe('safeObjectKey', () => {
  describe('isSafeObjectKey', () => {
    it.each([['name'], ['riskScore'], ['a.b'], ['field-1'], ['__proto_x']])('accepts %s', (key) => {
      expect(isSafeObjectKey(key)).toBe(true);
    });

    it.each([
      ['__proto__'],
      ['constructor'],
      ['prototype'],
      ['toString'],
      ['hasOwnProperty'],
      ['valueOf'],
      ['__defineGetter__'],
      [''],
    ])('rejects %s', (key) => {
      expect(isSafeObjectKey(key)).toBe(false);
    });

    it('rejects non-strings and over-long keys', () => {
      expect(isSafeObjectKey(1)).toBe(false);
      expect(isSafeObjectKey(undefined)).toBe(false);
      expect(isSafeObjectKey({ toString: () => 'x' })).toBe(false);
      expect(isSafeObjectKey('a'.repeat(MAX_OBJECT_KEY_LENGTH + 1))).toBe(false);
    });
  });

  describe('isSafeSortField', () => {
    it('accepts plain identifiers', () => {
      expect(isSafeSortField('createdAt')).toBe(true);
      expect(isSafeSortField('_score')).toBe(true);
    });

    it.each([['__proto__'], ['constructor'], ['a.b'], ['1abc'], ['name desc'], ['a'.repeat(65)]])(
      'rejects %s',
      (field) => {
        expect(isSafeSortField(field)).toBe(false);
      }
    );
  });

  describe('validatePaginationParams sortBy handling', () => {
    it('builds orderBy for a plain field', () => {
      expect(validatePaginationParams({ sortBy: 'name', sortOrder: 'asc' }).orderBy).toEqual({ name: 'asc' });
      expect(validatePaginationParams({ sortBy: 'name' }).orderBy).toEqual({ name: 'desc' });
    });

    it.each([['__proto__'], ['constructor'], ['organization.name'], ['toString']])(
      'ignores unsafe sortBy %s',
      (sortBy) => {
        expect(validatePaginationParams({ sortBy }).orderBy).toBeUndefined();
      }
    );

    it('normalises an unexpected sortOrder to desc', () => {
      expect(validatePaginationParams({ sortBy: 'name', sortOrder: 'DROP' as any }).orderBy).toEqual({
        name: 'desc',
      });
    });
  });
});
