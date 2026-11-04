import { beforeEach, expect, it, vi } from 'vitest';
import encryptSecret from './encryptSecret';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';

const mockIsAsyncEncryptionAvailable = vi.fn();
const mockEncryptStringAsync = vi.fn();

vi.mock('electron', () => ({
  safeStorage: {
    isAsyncEncryptionAvailable: () => mockIsAsyncEncryptionAvailable(),
    encryptStringAsync: (...args: unknown[]) => mockEncryptStringAsync(...args),
  },
}));

beforeEach(() => {
  mockIsAsyncEncryptionAvailable.mockReset();
  mockEncryptStringAsync.mockReset();
});

it('암호화한 값을 base64 문자열로 돌려준다', async () => {
  mockIsAsyncEncryptionAvailable.mockResolvedValue(true);
  mockEncryptStringAsync.mockResolvedValue(Buffer.from('encrypted'));

  await expect(encryptSecret('secret')).resolves.toBe(Buffer.from('encrypted').toString('base64'));
  expect(mockEncryptStringAsync).toHaveBeenCalledWith('secret');
});

it('암호화할 수 없는 환경이면 암호화하지 않고 에러를 던진다', async () => {
  mockIsAsyncEncryptionAvailable.mockResolvedValue(false);

  await expect(encryptSecret('secret')).rejects.toThrow(ERROR_MESSAGE.ENCRYPTION_UNAVAILABLE);
  expect(mockEncryptStringAsync).not.toHaveBeenCalled();
});
