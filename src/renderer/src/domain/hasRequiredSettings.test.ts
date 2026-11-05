import { expect, it } from 'vitest';
import hasRequiredSettings from './hasRequiredSettings';
import type { Settings } from '../../../domain/settings/_type';

const settings: Settings = {
  naverId: 'naver-id',
  storeName: '내 스토어',
  clientId: 'client-id',
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  restartDelayMinutes: null,
  productDelaySeconds: 10,
  isDryRun: false,
  encryptedNaverPassword: 'encrypted-password',
  encryptedClientSecret: 'encrypted-client-secret',
  encryptedServiceAccountKey: 'encrypted-key',
};

it('필수 값이 모두 있으면 true를 돌려준다', () => {
  expect(hasRequiredSettings(settings)).toBe(true);
});

it('일반 입력값이 비어 있으면 false를 돌려준다', () => {
  expect(hasRequiredSettings({ ...settings, storeName: '' })).toBe(false);
});

it('암호문이 비어 있으면 false를 돌려준다', () => {
  expect(hasRequiredSettings({ ...settings, encryptedServiceAccountKey: '' })).toBe(false);
});
