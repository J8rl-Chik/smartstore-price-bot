import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import generateAccessToken from './generateAccessToken.js';

const mockFetch = vi.fn();
const mockHashSync = vi.fn();

vi.mock('node-fetch', () => ({
  default: (...args: unknown[]) => mockFetch(...args),
}));

vi.mock('bcrypt', () => ({
  default: {
    hashSync: (...args: unknown[]) => mockHashSync(...args),
  },
}));

describe('generateAccessToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      CLIENT_ID: 'test-client-id',
      CLIENT_SECRET: 'test-client-secret',
    };
    mockHashSync.mockReturnValue('hashed-signature');
  });

  afterEach(() => {
    mockFetch.mockReset();
    mockHashSync.mockReset();
    process.env = originalEnv;
  });

  it('발급받은 access_token을 반환한다', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'issued-token' }) });

    await expect(generateAccessToken()).resolves.toBe('issued-token');
  });

  it('네이버 OAuth 엔드포인트에 필수 파라미터를 담아 POST 요청한다', async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ access_token: 'issued-token' }) });

    await generateAccessToken();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, option] = mockFetch.mock.calls[0] as [string, { method: string }];
    const { searchParams } = new URL(url);

    expect(url.startsWith('https://api.commerce.naver.com/external/v1/oauth2/token?')).toBe(true);
    expect(option.method).toBe('POST');
    expect(searchParams.get('client_id')).toBe('test-client-id');
    expect(searchParams.get('grant_type')).toBe('client_credentials');
    expect(searchParams.get('type')).toBe('SELF');
    // client_secret_sign은 CLIENT_SECRET을 bcrypt로 해싱한 값이어야 하며, 원문 시크릿이 그대로 노출되면 안 된다.
    expect(searchParams.get('client_secret_sign')).toBe(
      Buffer.from('hashed-signature', 'utf-8').toString('base64'),
    );
    expect(url).not.toContain('test-client-secret');
  });

  it('토큰 발급 요청이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const networkError = new Error('네트워크 오류');

    mockFetch.mockRejectedValue(networkError);

    await expect(generateAccessToken()).rejects.toMatchObject({
      message: '네이버 접근 토큰을 발급받지 못했습니다.',
      cause: networkError,
    });
  });

  it('응답 파싱이 실패해도 원인을 보존한 채 에러를 던진다', async () => {
    const parseError = new Error('잘못된 JSON');

    mockFetch.mockResolvedValue({ json: () => Promise.reject(parseError) });

    await expect(generateAccessToken()).rejects.toMatchObject({
      message: '네이버 접근 토큰을 발급받지 못했습니다.',
      cause: parseError,
    });
  });

  it('서명 생성(bcrypt) 단계에서 동기 에러가 발생해도 원인을 보존한 채 에러를 던진다', async () => {
    const signingError = new Error('잘못된 CLIENT_SECRET 형식');

    mockHashSync.mockImplementation(() => {
      throw signingError;
    });

    await expect(generateAccessToken()).rejects.toMatchObject({
      message: '네이버 접근 토큰을 발급받지 못했습니다.',
      cause: signingError,
    });
  });

  it('응답에 message가 있으면(네이버 쪽 토큰 발급 실패) 원인을 보존한 채 에러를 던진다', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ message: '유효하지 않은 클라이언트입니다.' }),
    });

    await expect(generateAccessToken()).rejects.toMatchObject({
      message: '네이버 접근 토큰을 발급받지 못했습니다.',
      cause: expect.objectContaining({ message: '유효하지 않은 클라이언트입니다.' }),
    });
  });
});
