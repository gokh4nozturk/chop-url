/**
 * Helper function to bypass TypeScript type checking for DrizzleORM operations
 * This is needed because DrizzleORM's type inference doesn't work correctly with our schema
 * @param data Any data that needs to be passed to DrizzleORM
 * @returns The same data, but with type checking bypassed
 */
export function withSchema<T, R = T>(data: T): R {
  return data as unknown as R;
}
