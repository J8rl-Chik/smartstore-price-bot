import { afterEach, describe, expect, it, vi } from 'vitest';
import createPage from './createPage.js';
import setWebdriverFalse from './setWebdriverFalse.js';

const mockLaunch = vi.fn();

vi.mock('puppeteer', () => ({
  default: {
    launch: (...args: unknown[]) => mockLaunch(...args),
  },
}));

const createMockPage = () => ({
  evaluateOnNewDocument: vi.fn(),
});

describe('createPage', () => {
  afterEach(() => {
    mockLaunch.mockReset();
  });

  it('브라우저와 그 첫 번째 페이지를 함께 반환한다', async () => {
    const mockPage = createMockPage();
    const mockBrowser = { pages: () => Promise.resolve([mockPage]) };

    mockLaunch.mockResolvedValue(mockBrowser);

    const result = await createPage();

    expect(result.browser).toBe(mockBrowser);
    expect(result.page).toBe(mockPage);
  });

  it('headless: false로 브라우저를 실행한다', async () => {
    const mockPage = createMockPage();

    mockLaunch.mockResolvedValue({ pages: () => Promise.resolve([mockPage]) });

    await createPage();

    expect(mockLaunch).toHaveBeenCalledWith(expect.objectContaining({ headless: false }));
  });

  it('navigator.webdriver를 숨기는 스크립트를 새 문서에 주입한다', async () => {
    const mockPage = createMockPage();

    mockLaunch.mockResolvedValue({ pages: () => Promise.resolve([mockPage]) });

    await createPage();

    expect(mockPage.evaluateOnNewDocument).toHaveBeenCalledWith(setWebdriverFalse);
  });

  it('브라우저에 페이지가 하나도 없으면 원인을 보존한 채 에러를 던진다', async () => {
    mockLaunch.mockResolvedValue({ pages: () => Promise.resolve([]) });

    await expect(createPage()).rejects.toMatchObject({
      message: '브라우저 페이지를 생성하지 못했습니다.',
      cause: expect.objectContaining({ message: '브라우저에서 페이지를 가져오지 못했습니다.' }),
    });
  });

  it('브라우저 실행이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const launchError = new Error('브라우저 실행 실패');

    mockLaunch.mockRejectedValue(launchError);

    await expect(createPage()).rejects.toMatchObject({
      message: '브라우저 페이지를 생성하지 못했습니다.',
      cause: launchError,
    });
  });
});
