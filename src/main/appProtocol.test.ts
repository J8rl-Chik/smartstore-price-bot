import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, expect, it, vi } from 'vitest';
import { registerAppProtocol, registerAppScheme } from './appProtocol';

const mockRegisterSchemesAsPrivileged = vi.fn();
const mockHandle = vi.fn();
const mockFetch = vi.fn();

vi.mock('electron', () => ({
  protocol: {
    registerSchemesAsPrivileged: (...args: unknown[]) => mockRegisterSchemesAsPrivileged(...args),
    handle: (...args: unknown[]) => mockHandle(...args),
  },
  net: { fetch: (...args: unknown[]) => mockFetch(...args) },
}));

afterEach(() => {
  mockRegisterSchemesAsPrivileged.mockReset();
  mockHandle.mockReset();
  mockFetch.mockReset();
});

it('app 스킴을 standard, secure, fetch 지원 스킴으로 등록한다', () => {
  registerAppScheme();

  expect(mockRegisterSchemesAsPrivileged).toHaveBeenCalledWith([
    { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
});

it('app 스킴의 요청 처리기를 등록한다', () => {
  registerAppProtocol();

  expect(mockHandle).toHaveBeenCalledWith('app', expect.any(Function));
});

// registerAppProtocol이 protocol.handle에 등록한 요청 처리기를 꺼내 요청 주소로 호출한다.
const requestAppURL = (url: string): unknown => {
  registerAppProtocol();
  const [, handler] = mockHandle.mock.calls[0];

  return handler({ url });
};

// 테스트는 소스(src/main)에서 실행되므로 src/renderer가 renderer 폴더다.
const rendererRoot = join(__dirname, '../renderer');

it('renderer 폴더 안의 파일을 file 주소로 불러와 응답한다', () => {
  const fileResponse = new Response('<html></html>');
  mockFetch.mockReturnValue(fileResponse);

  const response = requestAppURL('app://renderer/index.html');

  expect(mockFetch).toHaveBeenCalledWith(pathToFileURL(join(rendererRoot, 'index.html')).href);
  expect(response).toBe(fileResponse);
});

it('하위 폴더의 파일도 renderer 폴더 기준으로 불러온다', () => {
  requestAppURL('app://renderer/assets/index-abc123.js');

  expect(mockFetch).toHaveBeenCalledWith(
    pathToFileURL(join(rendererRoot, 'assets/index-abc123.js')).href,
  );
});

it('퍼센트 인코딩된 파일 이름은 디코딩해서 불러온다', () => {
  requestAppURL('app://renderer/assets/my%20image.png');

  expect(mockFetch).toHaveBeenCalledWith(
    pathToFileURL(join(rendererRoot, 'assets/my image.png')).href,
  );
});

it('인코딩한 ../로 renderer 폴더 밖을 가리키면 404로 응답하고 파일을 불러오지 않는다', () => {
  const response = requestAppURL('app://renderer/..%2F..%2Fpackage.json') as Response;

  expect(response.status).toBe(404);
  expect(mockFetch).not.toHaveBeenCalled();
});

it('경로에 인코딩한 역슬래시가 있으면 404로 응답한다', () => {
  const response = requestAppURL('app://renderer/..%5C..%5Cpackage.json') as Response;

  expect(response.status).toBe(404);
  expect(mockFetch).not.toHaveBeenCalled();
});

it('renderer 폴더 자체를 요청하면 404로 응답한다', () => {
  const response = requestAppURL('app://renderer/') as Response;

  expect(response.status).toBe(404);
  expect(mockFetch).not.toHaveBeenCalled();
});

it('renderer가 아닌 호스트로 요청하면 404로 응답한다', () => {
  const response = requestAppURL('app://other/index.html') as Response;

  expect(response.status).toBe(404);
  expect(mockFetch).not.toHaveBeenCalled();
});

it('디코딩할 수 없는 경로면 404로 응답한다', () => {
  const response = requestAppURL('app://renderer/%E0%A4%A') as Response;

  expect(response.status).toBe(404);
  expect(mockFetch).not.toHaveBeenCalled();
});
