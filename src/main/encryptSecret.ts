import { safeStorage } from 'electron';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';

/**
 * 비밀값을 OS 키체인 기반으로 암호화해 base64 문자열로 돌려준다.
 * 암호화할 수 없는 환경이면 평문이 저장되지 않도록 에러를 던진다.
 */
const encryptSecret = async (secret: string): Promise<string> => {
  if (!(await safeStorage.isAsyncEncryptionAvailable())) {
    throw new Error(ERROR_MESSAGE.ENCRYPTION_UNAVAILABLE);
  }

  const encryptedSecret = await safeStorage.encryptStringAsync(secret);

  return encryptedSecret.toString('base64');
};

export default encryptSecret;
