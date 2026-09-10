import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import loginNaver from './loginNaver.js';

const mockEvaluate = vi.fn();

const createMockPage = () => ({
  goto: vi.fn(),
  click: vi.fn(),
  type: vi.fn(),
  evaluate: mockEvaluate,
});

vi.mock('../../utils/delayRandomSeconds.js', () => ({ default: vi.fn() }));

describe('loginNaver', () => {
  vi.stubEnv('NAVER_ID', 'test-id');
  vi.stubEnv('NAVER_PASSWORD', 'test-password');

  beforeEach(() => {
    mockEvaluate.mockReturnValue(true);
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it('네이버 로그인 페이지로 이동한다', async () => {
    const mockPage = createMockPage();

    await loginNaver(mockPage as unknown as Page);

    expect(mockPage.goto).toHaveBeenCalledWith('https://www.naver.com/');
  });

  it('아이디/비밀번호 입력란을 클릭한 뒤 환경변수 값을 입력한다', async () => {
    const mockPage = createMockPage();

    await loginNaver(mockPage as unknown as Page);

    const delay = 100;
    const idSelector = '#id';
    const pwSelector = '#pw';

    expect(mockPage.click).toHaveBeenCalledWith(idSelector);
    expect(mockPage.type).toHaveBeenCalledWith(idSelector, 'test-id', { delay });
    expect(mockPage.click).toHaveBeenCalledWith(pwSelector);
    expect(mockPage.type).toHaveBeenCalledWith(pwSelector, 'test-password', { delay });
  });

  it('로그인 버튼을 클릭한다', async () => {
    const mockPage = createMockPage();

    await loginNaver(mockPage as unknown as Page);

    expect(mockPage.click).toHaveBeenCalledWith('#loginBtn_row');
  });

  it('로그인 페이지가 아니면, click 함수를 호출하지 않는다.', async () => {
    mockEvaluate.mockReturnValue(false);

    const mockPage = createMockPage();

    await loginNaver(mockPage as unknown as Page);

    expect(mockPage.click).not.toHaveBeenCalled();
  });

  it('아이디 입력 필드 조작 중 에러가 발생하면 원인을 보존한 채 에러를 던진다', async () => {
    const clickError = new Error('요소를 찾을 수 없습니다');
    const mockPage = createMockPage();

    mockPage.click.mockRejectedValue(clickError);

    await expect(loginNaver(mockPage as unknown as Page)).rejects.toMatchObject({
      message: '네이버 로그인에 실패했습니다.',
      cause: clickError,
    });
  });

  it('페이지 이동이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const gotoError = new Error('네트워크 오류');
    const mockPage = createMockPage();

    mockPage.goto.mockRejectedValue(gotoError);

    await expect(loginNaver(mockPage as unknown as Page)).rejects.toMatchObject({
      message: '네이버 로그인에 실패했습니다.',
      cause: gotoError,
    });
  });
});
