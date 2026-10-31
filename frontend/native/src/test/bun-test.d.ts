declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toHaveLength(expected: number): void;
    toBeNull(): void;
    toContain(expected: string): void;
    toThrow(expected?: RegExp | string): void;
    not: {
      toContain(expected: string): void;
    };
    rejects: {
      toThrow(expected?: RegExp | string): Promise<void>;
    };
  };
}
