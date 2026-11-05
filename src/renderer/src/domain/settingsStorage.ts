import { MIN_PRODUCT_DELAY_SECONDS } from './parseProductDelay';
import type { Settings } from '../../../domain/settings/_type';

const settingsStorageKey = 'settings';

export const DEFAULT_SETTINGS: Settings = {
  naverId: '',
  storeName: '',
  clientId: '',
  sheetId: '',
  sheetName: '',
  restartDelayMinutes: null,
  productDelaySeconds: MIN_PRODUCT_DELAY_SECONDS,
  isDryRun: false,
  encryptedNaverPassword: '',
  encryptedClientSecret: '',
  encryptedServiceAccountKey: '',
};

/**
 * 저장한 설정을 읽는다. 저장한 적이 없거나 값이 깨졌으면 기본값을 돌려준다.
 * 나중에 추가한 항목이 저장값에 없어도 기본값으로 채워지도록 기본값 위에 덮어쓴다.
 */
export const readSettings = (): Settings => {
  const storedSettings = localStorage.getItem(settingsStorageKey);

  if (storedSettings === null) {
    return DEFAULT_SETTINGS;
  }

  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
};
