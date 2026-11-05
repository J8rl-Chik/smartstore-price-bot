import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';

const mockCreatePage = vi.fn();
const mockLoginNaver = vi.fn();

vi.mock(import('../integrations/puppeteer/createPage'), () => ({
  default: (...args: unknown[]) => mockCreatePage(...args),
}));

vi.mock(import('../integrations/puppeteer/loginNaver'), () => ({
  default: (...args: unknown[]) => mockLoginNaver(...args),
}));

// 로그인한 페이지를 모듈 최상위에 보관하므로, 테스트끼리 섞이지 않도록 테스트마다 모듈을 새로 불러온다.
beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  mockCreatePage.mockReset();
  mockLoginNaver.mockReset();
});

const importBrowserSession = () => import('./browserSession');

// 닫힘 여부를 확인하는 isClosed와 browser().connected만 가진 가짜 page를 만든다.
const createFakePage = ({ isClosed = false, isConnected = true } = {}): Page =>
  ({
    isClosed: () => isClosed,
    browser: () => ({ connected: isConnected }),
  }) as unknown as Page;

const naverAccount = { naverId: 'test-id', naverPassword: 'test-password' };

it('열린 페이지가 없으면 새 페이지를 열어 로그인한 뒤 반환한다', async () => {
  const page = createFakePage();
  mockCreatePage.mockResolvedValue({ browser: {}, page });
  const { getLoggedInPage } = await importBrowserSession();

  await expect(getLoggedInPage(naverAccount)).resolves.toBe(page);
  expect(mockLoginNaver).toHaveBeenCalledWith(page, naverAccount);
});

it('다시 호출되면 다시 로그인하지 않고 이전에 로그인한 페이지를 반환한다', async () => {
  const page = createFakePage();
  mockCreatePage.mockResolvedValue({ browser: {}, page });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage(naverAccount);

  await expect(getLoggedInPage(naverAccount)).resolves.toBe(page);
  expect(mockCreatePage).toHaveBeenCalledTimes(1);
  expect(mockLoginNaver).toHaveBeenCalledTimes(1);
});

it('사용자가 브라우저 탭을 닫았으면 새 페이지를 열어 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: {}, page: createFakePage({ isClosed: true }) })
    .mockResolvedValueOnce({ browser: {}, page: newPage });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage(naverAccount);

  await expect(getLoggedInPage(naverAccount)).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage, naverAccount);
});

it('사용자가 브라우저 창을 닫았으면 새 페이지를 열어 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: {}, page: createFakePage({ isConnected: false }) })
    .mockResolvedValueOnce({ browser: {}, page: newPage });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage(naverAccount);

  await expect(getLoggedInPage(naverAccount)).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage, naverAccount);
});

it('로그인에 실패하면 연 브라우저를 닫고 로그인 에러를 그대로 던진다', async () => {
  const mockClose = vi.fn();
  const loginError = new Error('네이버 로그인에 실패했습니다.');
  mockCreatePage.mockResolvedValue({ browser: { close: mockClose }, page: createFakePage() });
  mockLoginNaver.mockRejectedValue(loginError);
  const { getLoggedInPage } = await importBrowserSession();

  await expect(getLoggedInPage(naverAccount)).rejects.toBe(loginError);
  expect(mockClose).toHaveBeenCalledTimes(1);
});

it('로그인에 실패한 뒤 다시 호출되면 새 페이지를 열어 다시 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: { close: vi.fn() }, page: createFakePage() })
    .mockResolvedValueOnce({ browser: {}, page: newPage });
  mockLoginNaver.mockRejectedValueOnce(new Error('네이버 로그인에 실패했습니다.'));
  const { getLoggedInPage } = await importBrowserSession();

  await expect(getLoggedInPage(naverAccount)).rejects.toThrow();
  await expect(getLoggedInPage(naverAccount)).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage, naverAccount);
});

it('탭과 창이 열려 있으면 isPageClosed가 false를 반환한다', async () => {
  const { isPageClosed } = await importBrowserSession();

  expect(isPageClosed(createFakePage())).toBe(false);
});

it('탭이 닫혔으면 isPageClosed가 true를 반환한다', async () => {
  const { isPageClosed } = await importBrowserSession();

  expect(isPageClosed(createFakePage({ isClosed: true }))).toBe(true);
});

it('브라우저 연결이 끊겼으면 isPageClosed가 true를 반환한다', async () => {
  const { isPageClosed } = await importBrowserSession();

  expect(isPageClosed(createFakePage({ isConnected: false }))).toBe(true);
});

// close 호출을 확인할 수 있는 가짜 browser를 만든다.
const createFakeBrowser = ({ isConnected = true } = {}) => ({
  connected: isConnected,
  close: vi.fn(),
});

it('로그인한 뒤 closeBrowser를 호출하면 보관한 브라우저를 닫는다', async () => {
  const browser = createFakeBrowser();
  mockCreatePage.mockResolvedValue({ browser, page: createFakePage() });
  const { getLoggedInPage, closeBrowser } = await importBrowserSession();

  await getLoggedInPage(naverAccount);
  await closeBrowser();

  expect(browser.close).toHaveBeenCalledTimes(1);
});

it('closeBrowser를 호출한 뒤 다시 호출되면 새 페이지를 열어 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: createFakeBrowser(), page: createFakePage() })
    .mockResolvedValueOnce({ browser: createFakeBrowser(), page: newPage });
  const { getLoggedInPage, closeBrowser } = await importBrowserSession();

  await getLoggedInPage(naverAccount);
  await closeBrowser();

  await expect(getLoggedInPage(naverAccount)).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage, naverAccount);
});

it('로그인한 적이 없으면 closeBrowser는 에러 없이 끝난다', async () => {
  const { closeBrowser } = await importBrowserSession();

  await expect(closeBrowser()).resolves.toBeUndefined();
});

it('사용자가 이미 브라우저 창을 닫았으면 closeBrowser는 브라우저를 닫지 않는다', async () => {
  const browser = createFakeBrowser({ isConnected: false });
  mockCreatePage.mockResolvedValue({ browser, page: createFakePage() });
  const { getLoggedInPage, closeBrowser } = await importBrowserSession();

  await getLoggedInPage(naverAccount);
  await closeBrowser();

  expect(browser.close).not.toHaveBeenCalled();
});
