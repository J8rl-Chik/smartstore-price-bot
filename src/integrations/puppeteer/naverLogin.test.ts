import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import naverLogin from './naverLogin.js';

const createMockPage = () => ({
  goto: vi.fn(),
  click: vi.fn(),
  type: vi.fn(),
});

describe('naverLogin', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NAVER_ID: 'test-id',
      NAVER_PASSWORD: 'test-password',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('네이버 로그인 페이지로 이동한다', async () => {
    const mockPage = createMockPage();

    await naverLogin(mockPage as unknown as Page);

    expect(mockPage.goto).toHaveBeenCalledWith('https://nid.naver.com/');
  });

  it('아이디/비밀번호 입력란을 클릭한 뒤 환경변수 값을 입력한다', async () => {
    const mockPage = createMockPage();

    await naverLogin(mockPage as unknown as Page);

    expect(mockPage.click).toHaveBeenCalledWith('#id');
    expect(mockPage.type).toHaveBeenCalledWith('#id', 'test-id', { delay: 100 });
    expect(mockPage.click).toHaveBeenCalledWith('#pw');
    expect(mockPage.type).toHaveBeenCalledWith('#pw', 'test-password', { delay: 100 });
  });

  it('로그인 버튼을 클릭한다', async () => {
    const mockPage = createMockPage();

    await naverLogin(mockPage as unknown as Page);

    expect(mockPage.click).toHaveBeenCalledWith('#loginBtn_row');
  });

  it('아이디 입력 필드 조작 중 에러가 발생하면 원인을 보존한 채 에러를 던진다', async () => {
    const clickError = new Error('요소를 찾을 수 없습니다');
    const mockPage = createMockPage();

    mockPage.click.mockRejectedValue(clickError);

    await expect(naverLogin(mockPage as unknown as Page)).rejects.toMatchObject({
      message: '네이버 로그인에 실패했습니다.',
      cause: clickError,
    });
  });

  it('페이지 이동이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const gotoError = new Error('네트워크 오류');
    const mockPage = createMockPage();

    mockPage.goto.mockRejectedValue(gotoError);

    await expect(naverLogin(mockPage as unknown as Page)).rejects.toMatchObject({
      message: '네이버 로그인에 실패했습니다.',
      cause: gotoError,
    });
  });
});
