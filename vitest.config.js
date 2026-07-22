import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts', 'src/util/**/*.test.ts', 'src/integrations/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/core/**/*.ts', 'src/util/**/*.ts', 'src/integrations/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
