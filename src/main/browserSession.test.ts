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

it('열린 페이지가 없으면 새 페이지를 열어 로그인한 뒤 반환한다', async () => {
  const page = createFakePage();
  mockCreatePage.mockResolvedValue({ browser: {}, page });
  const { getLoggedInPage } = await importBrowserSession();

  await expect(getLoggedInPage()).resolves.toBe(page);
  expect(mockLoginNaver).toHaveBeenCalledWith(page);
});

it('다시 호출되면 다시 로그인하지 않고 이전에 로그인한 페이지를 반환한다', async () => {
  const page = createFakePage();
  mockCreatePage.mockResolvedValue({ browser: {}, page });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage();

  await expect(getLoggedInPage()).resolves.toBe(page);
  expect(mockCreatePage).toHaveBeenCalledTimes(1);
  expect(mockLoginNaver).toHaveBeenCalledTimes(1);
});

it('사용자가 브라우저 탭을 닫았으면 새 페이지를 열어 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: {}, page: createFakePage({ isClosed: true }) })
    .mockResolvedValueOnce({ browser: {}, page: newPage });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage();

  await expect(getLoggedInPage()).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage);
});

it('사용자가 브라우저 창을 닫았으면 새 페이지를 열어 로그인한다', async () => {
  const newPage = createFakePage();
  mockCreatePage
    .mockResolvedValueOnce({ browser: {}, page: createFakePage({ isConnected: false }) })
    .mockResolvedValueOnce({ browser: {}, page: newPage });
  const { getLoggedInPage } = await importBrowserSession();

  await getLoggedInPage();

  await expect(getLoggedInPage()).resolves.toBe(newPage);
  expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage);
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
