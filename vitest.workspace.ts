import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  './packages/backend/vitest.config.ts',
  './packages/chop-url-fe/vitest.config.ts',
  './packages/chop-url-redirect/vitest.config.ts',
  './packages/chop-url-lib/vitest.config.ts',
]);
