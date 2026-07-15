import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['core/**/*.test.js', 'util/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['core/**/*.js', 'util/**/*.js'],
      exclude: ['**/*.test.js'],
    },
  },
});
