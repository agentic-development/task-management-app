import { describe, it, expect } from 'vitest';
import { generateKeyBetween, generateNKeysBetween } from './fractional-index';

describe('generateKeyBetween', () => {
  it('generates an initial key when both args are null', () => {
    const key = generateKeyBetween(null, null);
    expect(key).toBeTruthy();
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('generates a key before an existing key', () => {
    const existing = generateKeyBetween(null, null);
    const before = generateKeyBetween(null, existing);
    expect(before < existing).toBe(true);
  });

  it('generates a key after an existing key', () => {
    const existing = generateKeyBetween(null, null);
    const after = generateKeyBetween(existing, null);
    expect(after > existing).toBe(true);
  });

  it('generates a key between two existing keys', () => {
    const a = generateKeyBetween(null, null);
    const b = generateKeyBetween(a, null);
    const mid = generateKeyBetween(a, b);
    expect(mid > a).toBe(true);
    expect(mid < b).toBe(true);
  });

  it('throws when before >= after', () => {
    expect(() => generateKeyBetween('b', 'a')).toThrow();
    expect(() => generateKeyBetween('a', 'a')).toThrow();
  });

  it('handles many sequential insertions at the end', () => {
    let prev: string | null = null;
    const keys: string[] = [];
    for (let i = 0; i < 50; i++) {
      const key = generateKeyBetween(prev, null);
      keys.push(key);
      prev = key;
    }
    // All keys should be in strictly ascending order
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }
  });

  it('handles many sequential insertions at the beginning', () => {
    let next: string | null = null;
    const keys: string[] = [];
    for (let i = 0; i < 50; i++) {
      const key = generateKeyBetween(null, next);
      keys.push(key);
      next = key;
    }
    // All keys should be in strictly descending order (we inserted at front)
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] < keys[i - 1]).toBe(true);
    }
  });

  it('handles many insertions between two keys', () => {
    let a = generateKeyBetween(null, null);
    let b = generateKeyBetween(a, null);
    const keys: string[] = [a, b];

    for (let i = 0; i < 20; i++) {
      const mid = generateKeyBetween(a, b);
      expect(mid > a).toBe(true);
      expect(mid < b).toBe(true);
      keys.push(mid);
      // Narrow the range by alternating
      if (i % 2 === 0) {
        a = mid;
      } else {
        b = mid;
      }
    }
  });
});

describe('generateNKeysBetween', () => {
  it('returns empty array for n=0', () => {
    expect(generateNKeysBetween(null, null, 0)).toEqual([]);
  });

  it('returns one key for n=1', () => {
    const keys = generateNKeysBetween(null, null, 1);
    expect(keys).toHaveLength(1);
  });

  it('returns n keys in sorted order', () => {
    const keys = generateNKeysBetween(null, null, 5);
    expect(keys).toHaveLength(5);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }
  });

  it('returns keys between before and after', () => {
    const before = 'A';
    const after = 'z';
    const keys = generateNKeysBetween(before, after, 3);
    expect(keys).toHaveLength(3);
    expect(keys[0] > before).toBe(true);
    expect(keys[keys.length - 1] < after).toBe(true);
    for (let i = 1; i < keys.length; i++) {
      expect(keys[i] > keys[i - 1]).toBe(true);
    }
  });
});
