import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/utils/**/*.ts', 'src/integrations/**/*.ts'],
      exclude: ['**/*.test.ts'],
    },
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: [
            'src/domain/**/*.test.ts',
            'src/utils/**/*.test.ts',
            'src/integrations/**/*.test.ts',
          ],
        },
      },
      {
        plugins: [react()],
        test: {
          name: 'browser',
          include: ['src/renderer/src/**/*.test.tsx'],
          browser: {
            provider: playwright(),
            enabled: true,
            // at least one instance is required
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
