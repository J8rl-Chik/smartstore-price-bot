import { afterEach, describe, expect, it, vi } from 'vitest';
import createPage from './createPage.js';

const mockDelete = vi.fn();
const mockStealth = {
  enabledEvasions: {
    delete: mockDelete,
  },
};
const mockStealthPlugin = vi.fn().mockReturnValue(mockStealth);

const createMockPage = () => ({
  close: vi.fn(),
});

type MockPage = ReturnType<typeof createMockPage>;

const createMockBrowser = (
  mockPage: MockPage = createMockPage(),
  mockNewPage: MockPage = createMockPage(),
) => ({
  pages: async () => [mockPage],
  newPage: async () => mockNewPage,
});

const mockLaunch = vi.fn();
const mockUse = vi.fn();

vi.mock('puppeteer-extra', () => ({
  default: {
    launch: (...args: unknown[]) => mockLaunch(...args),
    use: (...args: unknown[]) => mockUse(...args),
  },
}));

vi.mock('puppeteer-extra-plugin-stealth', () => ({
  default: (...args: unknown[]) => mockStealthPlugin(...args),
}));

describe('createPage', () => {
  afterEach(() => {
    mockLaunch.mockReset();
    mockDelete.mockClear();
  });

  it('스텔스 모드로 실행한다.', async () => {
    mockLaunch.mockResolvedValue(createMockBrowser());

    await createPage();

    expect(mockStealthPlugin).toHaveBeenCalled();
    expect(mockUse).toHaveBeenCalledWith(mockStealth);
  });

  it('시스템 언어(한국어)를 적용할 수 있도록, 기본 언어 영어 설정을 제거한다.', async () => {
    mockLaunch.mockResolvedValue(createMockBrowser());

    await createPage();

    expect(mockStealth.enabledEvasions.delete).toHaveBeenCalledWith('user-agent-override');
    expect(mockStealth.enabledEvasions.delete).toHaveBeenCalledWith('navigator.languages');
  });

  it('브라우저 생성 시 기존 페이지(탭)은 닫고 새 페이지(탭)을 브라우저와 함께 반환한다', async () => {
    const mockPage = createMockPage();
    const mockNewPage = createMockPage();
    const mockBrowser = createMockBrowser(mockPage, mockNewPage);

    mockLaunch.mockResolvedValue(mockBrowser);

    const result = await createPage();

    expect(mockPage.close).toHaveBeenCalled();
    expect(result.browser).toBe(mockBrowser);
    expect(result.page).toBe(mockNewPage);
  });

  it('headless: false로 브라우저를 실행한다', async () => {
    mockLaunch.mockResolvedValue(createMockBrowser());

    await createPage();

    expect(mockLaunch).toHaveBeenCalledWith(expect.objectContaining({ headless: false }));
  });

  it('브라우저에 페이지가 하나도 없으면 원인을 보존한 채 에러를 던진다', async () => {
    mockLaunch.mockResolvedValue({ pages: async () => [], newPage: vi.fn() });

    await expect(createPage()).rejects.toMatchObject({
      message: '브라우저 페이지를 생성하지 못했습니다.',
      cause: expect.objectContaining({ message: '브라우저 기본 페이지가 없습니다.' }),
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

  it('새 페이지 생성을 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const createError = new Error('페이지 생성 실패');

    mockLaunch.mockResolvedValue({
      pages: async () => [createMockPage()],
      newPage: vi.fn().mockRejectedValue(createError),
    });

    await expect(createPage()).rejects.toMatchObject({
      message: '브라우저 페이지를 생성하지 못했습니다.',
      cause: createError,
    });
  });
});
