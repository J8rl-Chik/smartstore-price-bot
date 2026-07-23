import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/domain/**/*.test.ts', 'src/utils/**/*.test.ts', 'src/integrations/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/utils/**/*.ts', 'src/integrations/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
  },
});
