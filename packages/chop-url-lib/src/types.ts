export {};

declare global {
  interface D1Database {
    prepare(query: string): D1PreparedStatement;
  }

  interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<D1Result>;
  }

  interface D1Result {
    success: boolean;
    error?: string;
    lastRowId?: number;
    changes?: number;
  }
} 