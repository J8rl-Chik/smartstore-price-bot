import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRendererOrigin, getRendererURL } from './rendererURL';

const { mockIs } = vi.hoisted(() => ({ mockIs: { dev: false } }));

vi.mock('@electron-toolkit/utils', () => ({ is: mockIs }));

const devServerURL = 'http://localhost:5173';

beforeEach(() => {
  vi.stubEnv('ELECTRON_RENDERER_URL', devServerURL);
});

afterEach(() => {
  vi.unstubAllEnvs();
  mockIs.dev = false;
});

describe('getRendererURL', () => {
  it('개발 모드이고 개발 서버 주소가 있으면 개발 서버 주소를 반환한다', () => {
    mockIs.dev = true;

    expect(getRendererURL()).toBe(devServerURL);
  });

  it('개발 모드여도 개발 서버 주소가 없으면 app 프로토콜의 index.html 주소를 반환한다', () => {
    mockIs.dev = true;
    vi.stubEnv('ELECTRON_RENDERER_URL', '');

    expect(getRendererURL()).toBe('app://renderer/index.html');
  });

  it('배포 빌드이면 개발 서버 주소가 있어도 app 프로토콜의 index.html 주소를 반환한다', () => {
    expect(getRendererURL()).toBe('app://renderer/index.html');
  });
});

describe('getRendererOrigin', () => {
  it('개발 모드이고 개발 서버 주소가 있으면 개발 서버의 origin을 반환한다', () => {
    mockIs.dev = true;
    vi.stubEnv('ELECTRON_RENDERER_URL', 'http://localhost:5173/');

    expect(getRendererOrigin()).toBe('http://localhost:5173');
  });

  it('개발 모드여도 개발 서버 주소가 없으면 app 프로토콜의 origin을 반환한다', () => {
    mockIs.dev = true;
    vi.stubEnv('ELECTRON_RENDERER_URL', '');

    expect(getRendererOrigin()).toBe('app://renderer');
  });

  it('배포 빌드이면 개발 서버 주소가 있어도 app 프로토콜의 origin을 반환한다', () => {
    expect(getRendererOrigin()).toBe('app://renderer');
  });
});
