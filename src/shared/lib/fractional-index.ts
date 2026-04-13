/**
 * Fractional indexing utilities for ordering lists and cards.
 *
 * Uses base-62 string keys so that a new position can always be inserted
 * between two existing positions without reindexing siblings.
 *
 * Alphabet: 0-9 A-Z a-z  (62 characters, lexicographically ordered by char code
 * within each group: digits < uppercase < lowercase).
 */

const BASE_62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const SMALLEST_CHAR = BASE_62[0]; // '0'
const LARGEST_CHAR = BASE_62[BASE_62.length - 1]; // 'z'

/**
 * Return the midpoint character between two base-62 characters.
 * Both parameters must be valid base-62 characters, and `a` must be
 * strictly less than `b`.
 */
function midChar(a: number, b: number): string {
  return BASE_62[Math.floor((a + b) / 2)];
}

function charIndex(c: string): number {
  const idx = BASE_62.indexOf(c);
  if (idx === -1) {
    throw new Error(`Invalid fractional-index character: "${c}"`);
  }
  return idx;
}

/**
 * Generate a fractional index string that sorts between `before` and `after`.
 *
 * - `generateKeyBetween(null, null)`       → initial key (e.g. "V")
 * - `generateKeyBetween(null, "V")`        → key before "V"
 * - `generateKeyBetween("V", null)`        → key after  "V"
 * - `generateKeyBetween("V", "X")`         → key between "V" and "X"
 *
 * The returned string is always strictly between `before` and `after` in
 * lexicographic order.
 */
export function generateKeyBetween(
  before: string | null,
  after: string | null,
): string {
  // Both null → return middle of range
  if (before === null && after === null) {
    return BASE_62[Math.floor(BASE_62.length / 2)]; // 'V'
  }

  // Before null → prepend something smaller
  if (before === null) {
    return decrementKey(after!);
  }

  // After null → append something larger
  if (after === null) {
    return incrementKey(before);
  }

  // Validate ordering
  if (before >= after) {
    throw new Error(
      `generateKeyBetween: "before" must be less than "after", got "${before}" >= "${after}"`,
    );
  }

  return midpoint(before, after);
}

/**
 * Generate `n` evenly-spaced keys between `before` and `after`.
 * Useful for initial bulk insertion (e.g. seeding a board with lists).
 */
export function generateNKeysBetween(
  before: string | null,
  after: string | null,
  n: number,
): string[] {
  if (n === 0) return [];
  if (n === 1) return [generateKeyBetween(before, after)];

  const keys: string[] = [];
  let prev = before;
  for (let i = 0; i < n; i++) {
    // Distribute remaining keys evenly
    const key = generateKeyBetween(prev, after);
    keys.push(key);
    prev = key;
  }
  return keys;
}

/**
 * Compute a string that sorts between `a` and `b`.
 * Both must be non-empty and `a < b` lexicographically.
 */
function midpoint(a: string, b: string): string {
  const maxLen = Math.max(a.length, b.length);
  let result = '';

  for (let i = 0; i < maxLen; i++) {
    const aChar = i < a.length ? charIndex(a[i]) : 0;
    const bChar = i < b.length ? charIndex(b[i]) : BASE_62.length;

    if (aChar === bChar) {
      result += BASE_62[aChar];
      continue;
    }

    const mid = Math.floor((aChar + bChar) / 2);
    if (mid > aChar) {
      return result + BASE_62[mid];
    }

    // aChar and bChar are adjacent — we need to go deeper
    result += BASE_62[aChar];
    // Continue with the remaining characters, treating b's remainder as the ceiling
    const aRest = a.slice(i + 1);
    const bRest = ''; // b[i] is adjacent to a[i], so the rest of b is irrelevant
    // Instead, we find a midpoint between aRest and the end of the range
    return result + midpointSuffix(aRest);
  }

  // Strings are equal up to maxLen — extend with a middle character
  return result + BASE_62[Math.floor(BASE_62.length / 2)];
}

/**
 * Given a suffix string, find a string that sorts between it and the
 * "end of range" (conceptually all z's).
 */
function midpointSuffix(s: string): string {
  for (let i = s.length - 1; i >= 0; i--) {
    const idx = charIndex(s[i]);
    if (idx < BASE_62.length - 1) {
      const mid = Math.floor((idx + BASE_62.length) / 2);
      return s.slice(0, i) + BASE_62[mid];
    }
  }
  return s + BASE_62[Math.floor(BASE_62.length / 2)];
}

/**
 * Return a key that sorts before the given key.
 *
 * When a character's index is 1 (second smallest), instead of halving to
 * the absolute minimum '0', we extend the key with '0' + a middle character.
 * This ensures an infinitely decreasing sequence:
 *   V → F → 7 → 3 → 1 → 0V → 0F → 07 → 03 → 01 → 00V → …
 */
function decrementKey(key: string): string {
  for (let i = key.length - 1; i >= 0; i--) {
    const idx = charIndex(key[i]);
    if (idx > 1) {
      return key.slice(0, i) + BASE_62[Math.floor(idx / 2)];
    }
    if (idx === 1) {
      // Go to '0' + middle char instead of bare '0' to leave room for
      // future decrements without hitting the absolute minimum.
      return (
        key.slice(0, i) +
        BASE_62[0] +
        BASE_62[Math.floor(BASE_62.length / 2)]
      );
    }
    // idx === 0: this position is already at minimum, try an earlier one
  }
  // All characters are '0'. A shorter string of zeros sorts before a
  // longer one ("0" < "00"), so we can trim one character.
  if (key.length > 1) {
    return key.slice(0, -1);
  }
  // key is "0" — the absolute minimum representable key.
  // This should not be reachable with the idx===1 handling above.
  throw new Error('Cannot generate a key before the minimum key "0"');
}

/**
 * Return a key that sorts after the given key.
 */
function incrementKey(key: string): string {
  for (let i = key.length - 1; i >= 0; i--) {
    const idx = charIndex(key[i]);
    if (idx < BASE_62.length - 1) {
      const mid = Math.floor((idx + BASE_62.length) / 2);
      return key.slice(0, i) + BASE_62[mid];
    }
  }
  // All chars are the largest — append a middle character
  return key + BASE_62[Math.floor(BASE_62.length / 2)];
}
