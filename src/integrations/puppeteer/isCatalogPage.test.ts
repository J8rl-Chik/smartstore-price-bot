import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import { executeScript, isRestrictedPage } from './isCatalogPage.js';
import type { Page } from 'puppeteer';

const setTextTemporaryPause = (text: string) => {
  vi.stubGlobal('document', {
    body: {
      innerText: text,
    },
  });
};

describe('isRestrictedPage', () => {
  const mockEvaluate = vi
    .fn()
    .mockImplementation((script: typeof executeScript, arg: string) => script(arg));
  const mockPage = {
    evaluate: mockEvaluate,
  };
  const text = '쇼핑 서비스 접속이 일시적';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('페이지의 텍스트 검증을 위해 page.evaluate를 호출한다.', async () => {
    setTextTemporaryPause(text);

    await isRestrictedPage(mockPage as unknown as Page, executeScript);

    expect(mockEvaluate).toHaveBeenCalled();
  });

  it('page.evaluate는 페이지에서 실행 할 함수와 찾아낼 문자열을 인자로 전달 받는다.', async () => {
    setTextTemporaryPause(text);

    await isRestrictedPage(mockPage as unknown as Page, executeScript);

    expect(mockEvaluate).toHaveBeenCalledWith(executeScript, '쇼핑 서비스 접속이 일시적');
  });

  it('페이지에서 실행 할 함수는 찾아낼 문자열을 인자로 전달 받는다.', async () => {
    setTextTemporaryPause(text);

    const mockExecuteScript = vi.fn();

    await isRestrictedPage(mockPage as unknown as Page, mockExecuteScript);

    expect(mockExecuteScript).toHaveBeenCalledWith('쇼핑 서비스 접속이 일시적');
  });

  it('페이지에서 실행 할 함수는 찾아낼 문자열을 인자로 전달 받는다.', async () => {
    setTextTemporaryPause(text);

    const mockExecuteScript = vi.fn().mockImplementation((arg: string) => executeScript(arg));

    await isRestrictedPage(mockPage as unknown as Page, mockExecuteScript);

    expect(mockExecuteScript.mock.results[0]?.value).toBe(true);
  });

  it('페이지에 관련없는 텍스트가 있으면 false를 반환한다.', async () => {
    setTextTemporaryPause('문제가 없는 텍스트');

    // const mockExecuteScript = vi.fn().mockImplementation((arg: string) => executeScript(arg));

    const result = await isRestrictedPage(mockPage as unknown as Page, executeScript);

    expect(result).toBe(false);
  });
});
