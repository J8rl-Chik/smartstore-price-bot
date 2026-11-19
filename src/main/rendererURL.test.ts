import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { getRendererURL } from './rendererURL';

const { mockIs } = vi.hoisted(() => ({ mockIs: { dev: false } }));

vi.mock('@electron-toolkit/utils', () => ({ is: mockIs }));

const devServerURL = 'http://localhost:5173';
const builtRendererURL = pathToFileURL(join(__dirname, '../renderer/index.html')).href;

beforeEach(() => {
  vi.stubEnv('ELECTRON_RENDERER_URL', devServerURL);
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockIs.dev = false;
});

it('개발 모드이고 개발 서버 주소가 있으면 개발 서버 주소를 반환한다', () => {
  mockIs.dev = true;

  expect(getRendererURL()).toBe(devServerURL);
});

it('개발 모드여도 개발 서버 주소가 없으면 빌드한 index.html의 file 주소를 반환한다', () => {
  mockIs.dev = true;
  vi.stubEnv('ELECTRON_RENDERER_URL', '');

  expect(getRendererURL()).toBe(builtRendererURL);
});

it('배포 빌드이면 개발 서버 주소가 있어도 빌드한 index.html의 file 주소를 반환한다', () => {
  expect(getRendererURL()).toBe(builtRendererURL);
});
