import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'core/**/*.test.js',
      'util/**/*.test.js',
      'src/core/**/*.test.ts',
      'src/util/**/*.test.ts',
    ],
    coverage: {
      provider: 'v8',
      include: ['core/**/*.js', 'util/**/*.js', 'src/core/**/*.ts', 'src/util/**/*.ts'],
      exclude: ['**/*.test.js', '**/*.test.ts'],
    },
  },
});
