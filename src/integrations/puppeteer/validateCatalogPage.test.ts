import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import validateCatalogPage, {
  hasTextInBody,
  isRequiredLogin,
  isRequiredSecureCheck,
  isRestrictedPage,
  UnexpectedCatalogPageError,
} from './validateCatalogPage.js';

const RESTRICTED_MESSAGE = '쇼핑 서비스 접속이 일시적';
const LOGIN_MESSAGE = '아이디 또는 전화번호';
const SECURE_CHECK_MESSAGE = '보안 확인을 완료해 주세요.';

const stubDocumentBodyText = (innerText: string): void => {
  vi.stubGlobal('document', { body: { innerText } });
};

const createMockPage = (hasMessage: boolean) => ({
  evaluate: vi.fn().mockResolvedValue(hasMessage),
});

describe('hasTextInBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('본문에 문구가 있으면 true를 반환한다', () => {
    stubDocumentBodyText('쇼핑 서비스 접속이 일시적으로 제한되었습니다.');

    expect(hasTextInBody(RESTRICTED_MESSAGE)).toBe(true);
  });

  it('여러 줄로 된 본문 중간에 문구가 있어도 true를 반환한다', () => {
    stubDocumentBodyText(
      '네이버 쇼핑\n쇼핑 서비스 접속이 일시적으로 제한되었습니다.\n잠시 후 다시 시도해 주세요.',
    );

    expect(hasTextInBody(RESTRICTED_MESSAGE)).toBe(true);
  });

  it('본문에 문구가 없으면 false를 반환한다', () => {
    stubDocumentBodyText('가격비교 페이지 본문');

    expect(hasTextInBody(RESTRICTED_MESSAGE)).toBe(false);
  });

  it('본문이 비어 있으면 false를 반환한다', () => {
    stubDocumentBodyText('');

    expect(hasTextInBody(RESTRICTED_MESSAGE)).toBe(false);
  });
});

// TODO: 겹치는 테스트가 많아 describe.each로 리팩토링 고려.
describe('isRestrictedPage', () => {
  it('브라우저에서 hasTextInBody를 rate limit 안내 문구로 실행하도록 evaluate에 넘긴다', async () => {
    const mockPage = createMockPage(false);

    await isRestrictedPage(mockPage as unknown as Page);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(hasTextInBody, RESTRICTED_MESSAGE);
  });

  it('evaluate가 true를 돌려주면 true를 반환한다', async () => {
    const mockPage = createMockPage(true);

    await expect(isRestrictedPage(mockPage as unknown as Page)).resolves.toBe(true);
  });

  it('evaluate가 false를 돌려주면 false를 반환한다', async () => {
    const mockPage = createMockPage(false);

    await expect(isRestrictedPage(mockPage as unknown as Page)).resolves.toBe(false);
  });

  it('evaluate가 실패하면(페이지 닫힘 등) 에러를 그대로 전파한다', async () => {
    const evaluateError = new Error('Execution context was destroyed');
    const mockPage = { evaluate: vi.fn().mockRejectedValue(evaluateError) };

    await expect(isRestrictedPage(mockPage as unknown as Page)).rejects.toThrow(evaluateError);
  });
});

describe('isRequiredLogin', () => {
  it('브라우저에서 hasTextInBody를 로그인 폼 문구로 실행하도록 evaluate에 넘긴다', async () => {
    const mockPage = createMockPage(false);

    await isRequiredLogin(mockPage as unknown as Page);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(hasTextInBody, LOGIN_MESSAGE);
  });

  it('evaluate가 true를 돌려주면 true를 반환한다', async () => {
    const mockPage = createMockPage(true);

    await expect(isRequiredLogin(mockPage as unknown as Page)).resolves.toBe(true);
  });

  it('evaluate가 false를 돌려주면 false를 반환한다', async () => {
    const mockPage = createMockPage(false);

    await expect(isRequiredLogin(mockPage as unknown as Page)).resolves.toBe(false);
  });

  it('evaluate가 실패하면(페이지 닫힘 등) 에러를 그대로 전파한다', async () => {
    const evaluateError = new Error('Execution context was destroyed');
    const mockPage = { evaluate: vi.fn().mockRejectedValue(evaluateError) };

    await expect(isRequiredLogin(mockPage as unknown as Page)).rejects.toThrow(evaluateError);
  });
});

describe('isRequiredSecureCheck', () => {
  it('브라우저에서 hasTextInBody를 보안 확인 문구로 실행하도록 evaluate에 넘긴다', async () => {
    const mockPage = createMockPage(false);

    await isRequiredSecureCheck(mockPage as unknown as Page);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(hasTextInBody, SECURE_CHECK_MESSAGE);
  });

  it('evaluate가 true를 돌려주면 true를 반환한다', async () => {
    const mockPage = createMockPage(true);

    await expect(isRequiredSecureCheck(mockPage as unknown as Page)).resolves.toBe(true);
  });

  it('evaluate가 false를 돌려주면 false를 반환한다', async () => {
    const mockPage = createMockPage(false);

    await expect(isRequiredSecureCheck(mockPage as unknown as Page)).resolves.toBe(false);
  });

  it('evaluate가 실패하면(페이지 닫힘 등) 에러를 그대로 전파한다', async () => {
    const evaluateError = new Error('Execution context was destroyed');
    const mockPage = { evaluate: vi.fn().mockRejectedValue(evaluateError) };

    await expect(isRequiredSecureCheck(mockPage as unknown as Page)).rejects.toThrow(evaluateError);
  });
});

describe('validateCatalogPage', () => {
  /**
   * validateCatalogPage는 세 판별 함수를 차례로 호출하고 각 호출은 다른 문구를 evaluate에 넘긴다.
   * 본문에 "표시된" 문구 목록을 받아, evaluate가 넘겨받은 문구가 그 안에 있는지로 응답한다.
   */
  const createMockPageShowing = (messagesInBody: string[]) => ({
    evaluate: vi
      .fn()
      .mockImplementation(async (_script: unknown, message: string) =>
        messagesInBody.includes(message),
      ),
  });

  it('세 안내 문구가 모두 없으면 정상 카탈로그 페이지로 보고 아무것도 던지지 않는다', async () => {
    const mockPage = createMockPageShowing([]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).resolves.toBeUndefined();
  });

  it('정상 페이지면 세 판별을 모두 수행한다', async () => {
    const mockPage = createMockPageShowing([]);

    await validateCatalogPage(mockPage as unknown as Page);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(3);
    expect(mockPage.evaluate).toHaveBeenNthCalledWith(1, hasTextInBody, RESTRICTED_MESSAGE);
    expect(mockPage.evaluate).toHaveBeenNthCalledWith(2, hasTextInBody, LOGIN_MESSAGE);
    expect(mockPage.evaluate).toHaveBeenNthCalledWith(3, hasTextInBody, SECURE_CHECK_MESSAGE);
  });

  it('"쇼핑 서비스 접속이 일시적" 안내 문구가 있으면 UnexpectedCatalogPageError를 던진다', async () => {
    const mockPage = createMockPageShowing([RESTRICTED_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow(
      UnexpectedCatalogPageError,
    );
  });

  it('"아이디 또는 전화번호" 문구가 있으면 UnexpectedCatalogPageError를 던진다', async () => {
    const mockPage = createMockPageShowing([LOGIN_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow(
      UnexpectedCatalogPageError,
    );
  });

  it('"보안 확인을 완료해 주세요" 문구가 있으면 UnexpectedCatalogPageError를 던진다', async () => {
    const mockPage = createMockPageShowing([SECURE_CHECK_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow(
      UnexpectedCatalogPageError,
    );
  });

  it('던지는 에러에 접속 제한 안내 메시지를 담는다', async () => {
    const mockPage = createMockPageShowing([RESTRICTED_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow(
      '네이버 쇼핑 접속이 일시적으로 제한되었습니다.',
    );
  });

  it('앞선 판별에서 걸리면 뒤의 판별은 수행하지 않는다', async () => {
    const mockPage = createMockPageShowing([RESTRICTED_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow();

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(hasTextInBody, RESTRICTED_MESSAGE);
  });

  it('두 번째 판별에서 걸리면 세 번째 판별은 수행하지 않는다', async () => {
    const mockPage = createMockPageShowing([LOGIN_MESSAGE]);

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow();

    expect(mockPage.evaluate).toHaveBeenCalledTimes(2);
    expect(mockPage.evaluate).not.toHaveBeenCalledWith(hasTextInBody, SECURE_CHECK_MESSAGE);
  });

  it('evaluate가 실패하면 UnexpectedCatalogPageError로 감싸지 않고 원래 에러를 그대로 전파한다', async () => {
    const evaluateError = new Error('Execution context was destroyed');
    const mockPage = { evaluate: vi.fn().mockRejectedValue(evaluateError) };

    await expect(validateCatalogPage(mockPage as unknown as Page)).rejects.toThrow(evaluateError);
  });
});
