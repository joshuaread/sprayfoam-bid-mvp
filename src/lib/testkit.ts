/**
 * Tiny expect() helper on top of Node's built-in test runner (node:test + node:assert).
 * Keeps the test files readable without pulling in a test framework and its native deps.
 */
import assert from 'node:assert/strict';

export { describe, it } from 'node:test';

type Matchers = {
  toBe(expected: unknown): void;
  toEqual(expected: unknown): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeLessThan(n: number): void;
  toBeGreaterThan(n: number): void;
  toContain(part: string): void;
  toMatch(re: RegExp): void;
};

export function expect(actual: unknown, message?: string): Matchers & { not: Pick<Matchers, 'toMatch' | 'toBe' | 'toEqual'> } {
  const m = (s: string) => (message ? `${message}: ${s}` : s);
  return {
    toBe: (e) => assert.strictEqual(actual, e, message),
    toEqual: (e) => assert.deepStrictEqual(actual, e, message),
    toBeNull: () => assert.strictEqual(actual, null, message),
    toBeUndefined: () => assert.strictEqual(actual, undefined, message),
    toBeLessThan: (n) => assert.ok((actual as number) < n, m(`expected ${String(actual)} < ${n}`)),
    toBeGreaterThan: (n) => assert.ok((actual as number) > n, m(`expected ${String(actual)} > ${n}`)),
    toContain: (part) => assert.ok(String(actual).includes(part), m(`expected "${String(actual)}" to contain "${part}"`)),
    toMatch: (re) => assert.match(String(actual), re, message),
    not: {
      toMatch: (re) => assert.doesNotMatch(String(actual), re, message),
      toBe: (e) => assert.notStrictEqual(actual, e, message),
      toEqual: (e) => assert.notDeepStrictEqual(actual, e, message),
    },
  };
}
