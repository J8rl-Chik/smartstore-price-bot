import { beforeEach, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, readSettings, saveSettings } from './settingsStorage';
import type { Settings } from '../../../domain/settings/_type';

// unit 프로젝트는 node 환경이라 localStorage가 없어 Map으로 대신한다.
const storedValues = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (key: string) => storedValues.get(key) ?? null,
  setItem: (key: string, value: string) => storedValues.set(key, value),
});

beforeEach(() => {
  storedValues.clear();
});

it('저장한 적이 없으면 기본값을 돌려준다', () => {
  expect(readSettings()).toEqual(DEFAULT_SETTINGS);
});

const settings: Settings = {
  naverId: 'naver-id',
  storeName: '내 스토어',
  clientId: 'client-id',
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  restartDelayMinutes: 30,
  productDelaySeconds: 20,
  isDryRun: true,
};

it('저장한 설정을 그대로 읽는다', () => {
  saveSettings(settings);

  expect(readSettings()).toEqual(settings);
});

it('저장값에 없는 항목은 기본값으로 채운다', () => {
  storedValues.set('settings', JSON.stringify({ naverId: 'naver-id' }));

  expect(readSettings()).toEqual({ ...DEFAULT_SETTINGS, naverId: 'naver-id' });
});

it('저장값이 JSON이 아니면 기본값을 돌려준다', () => {
  storedValues.set('settings', '{broken');

  expect(readSettings()).toEqual(DEFAULT_SETTINGS);
});
