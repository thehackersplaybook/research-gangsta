import { describe, it, expect } from 'vitest';
import { greet } from '../src/index';

describe('greet', () => {
  it('should return a greeting with the provided name', () => {
    expect(greet('Alice')).toBe('Hello, Alice!');
  });

  it('should return a default greeting when no name is provided', () => {
    expect(greet()).toBe('Hello, World!');
  });

  it('should handle empty string', () => {
    expect(greet('')).toBe('Hello, !');
  });
});
