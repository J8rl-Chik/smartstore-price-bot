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
            'src/main/**/*.test.ts',
            'src/preload/**/*.test.ts',
            'src/renderer/src/domain/**/*.test.ts',
          ],
        },
      },
      {
        // 앱 빌드(electron.vite.config.ts)와 같은 컴파일 결과로 테스트하도록 React 컴파일러를 함께 적용한다.
        plugins: [react({ babel: { plugins: ['babel-plugin-react-compiler'] } })],
        test: {
          name: 'browser',
          include: ['src/renderer/src/**/*.test.tsx'],
          browser: {
            provider: playwright(),
            enabled: true,
            // Electron 창 크기(src/main/index.ts)에 맞춘다.
            viewport: { width: 1440, height: 1024 },
            headless: true,
            // at least one instance is required
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
