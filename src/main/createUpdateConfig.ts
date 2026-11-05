import { safeStorage } from 'electron';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { Settings, UpdateConfig } from '../domain/settings/_type';

const decryptSecret = async (encryptedSecret: string): Promise<string> => {
  const { result } = await safeStorage.decryptStringAsync(Buffer.from(encryptedSecret, 'base64'));

  return result;
};

/**
 * 암호문을 복호화해 순회에 쓸 설정을 만든다.
 * JSON.parse 에러 메시지에는 키 내용 일부가 들어갈 수 있어, 로그로 새지 않도록 원인을 cause로 남기지 않는다.
 */
const createUpdateConfig = async (settings: Settings): Promise<UpdateConfig> => {
  try {
    const [naverPassword, clientSecret, serviceAccountKey] = await Promise.all([
      decryptSecret(settings.encryptedNaverPassword),
      decryptSecret(settings.encryptedClientSecret),
      decryptSecret(settings.encryptedServiceAccountKey),
    ]);

    return {
      naverAccount: { naverId: settings.naverId, naverPassword },
      commerceApiCredentials: { clientId: settings.clientId, clientSecret },
      googleSheetConfig: {
        sheetId: settings.sheetId,
        sheetName: settings.sheetName,
        auth: { credentials: JSON.parse(serviceAccountKey) },
      },
    };
  } catch {
    throw new Error(ERROR_MESSAGE.SECRET_DECRYPT_FAILED);
  }
};

export default createUpdateConfig;
