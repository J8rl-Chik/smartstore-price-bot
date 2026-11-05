import { beforeEach, expect, it, vi } from 'vitest';
import createUpdateConfig from './createUpdateConfig';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { Settings } from '../domain/settings/_type';

const mockDecryptStringAsync = vi.fn();

vi.mock('electron', () => ({
  safeStorage: {
    decryptStringAsync: (...args: unknown[]) => mockDecryptStringAsync(...args),
  },
}));

beforeEach(() => {
  mockDecryptStringAsync.mockReset();
  mockDecryptStringAsync.mockImplementation(async (encrypted: Buffer) => ({
    shouldReEncrypt: false,
    result: encrypted.toString(),
  }));
});

const credentials = { client_email: 'bot@example.com', private_key: 'private-key' };

// 암호문을 base64로 만든 값이라고 가정하고, 복호화 결과로 평문을 그대로 돌려준다.
const encodeSecret = (secret: string): string => Buffer.from(secret).toString('base64');

const settings: Settings = {
  naverId: 'naver-id',
  storeName: '내 스토어',
  clientId: 'client-id',
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  restartDelayMinutes: 30,
  productDelaySeconds: 20,
  isDryRun: true,
  encryptedNaverPassword: encodeSecret('plain-password'),
  encryptedClientSecret: encodeSecret('plain-client-secret'),
  encryptedServiceAccountKey: encodeSecret(JSON.stringify(credentials)),
};

it('암호문을 복호화해 순회에 쓸 설정을 만든다', async () => {
  await expect(createUpdateConfig(settings)).resolves.toEqual({
    naverAccount: { naverId: 'naver-id', naverPassword: 'plain-password' },
    commerceApiCredentials: { clientId: 'client-id', clientSecret: 'plain-client-secret' },
    googleSheetConfig: { sheetId: 'sheet-id', sheetName: '상품 목록', auth: { credentials } },
  });
});

it('복호화에 실패하면 다시 입력하라는 에러를 던진다', async () => {
  mockDecryptStringAsync.mockRejectedValue(new Error('복호화 실패'));

  await expect(createUpdateConfig(settings)).rejects.toThrow(ERROR_MESSAGE.SECRET_DECRYPT_FAILED);
});

it('서비스 계정 키가 JSON이 아니면 키 내용을 에러에 남기지 않는다', async () => {
  const error = await createUpdateConfig({
    ...settings,
    encryptedServiceAccountKey: encodeSecret('secret-key-content'),
  }).catch((rejectedError: unknown) => rejectedError);

  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toBe(ERROR_MESSAGE.SECRET_DECRYPT_FAILED);
  expect((error as Error).cause).toBeUndefined();
});
