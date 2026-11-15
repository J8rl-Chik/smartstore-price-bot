import { afterEach, expect, it, vi } from 'vitest';

const mockCheckForUpdates = vi.fn();
const mockNotification = vi.fn();
const mockShow = vi.fn();

vi.mock('electron', () => ({
  app: { name: 'smartstore-price-bot' },
  // new Notification(options)로 만든 뒤 show()를 부르므로, 생성 인자와 show 호출을 함께 기록한다.
  Notification: class {
    constructor(options: unknown) {
      mockNotification(options);
    }

    show() {
      mockShow();
    }
  },
}));

vi.mock('electron-updater', () => ({
  autoUpdater: {
    checkForUpdates: () => mockCheckForUpdates(),
  },
}));

import checkAppUpdate from './checkAppUpdate';

afterEach(() => {
  mockCheckForUpdates.mockReset();
  mockNotification.mockReset();
  mockShow.mockReset();
});

it('확인에 실패하면 에러를 던지지 않고 알림도 띄우지 않는다', async () => {
  mockCheckForUpdates.mockRejectedValue(new Error('네트워크 오류'));

  await expect(checkAppUpdate()).resolves.toBeUndefined();
  expect(mockShow).not.toHaveBeenCalled();
});

it('패키징하지 않은 앱이라 확인을 건너뛰면 알림을 띄우지 않는다', async () => {
  mockCheckForUpdates.mockResolvedValue(null);

  await checkAppUpdate();

  expect(mockShow).not.toHaveBeenCalled();
});

it('이미 최신 버전이면 알림을 띄우지 않는다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: false,
    updateInfo: { version: '1.0.0' },
  });

  await checkAppUpdate();

  expect(mockShow).not.toHaveBeenCalled();
});

it('내려받기에 실패하면 에러를 던지지 않고 실패 알림을 띄운다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: true,
    updateInfo: { version: '1.0.1' },
    downloadPromise: Promise.reject(new Error('다운로드 중 네트워크 오류')),
  });

  await expect(checkAppUpdate()).resolves.toBeUndefined();
  expect(mockNotification).toHaveBeenCalledWith({
    title: 'Update download failed',
    body: 'smartstore-price-bot version 1.0.1 could not be downloaded. It will try again the next time the app starts.',
  });
  expect(mockShow).toHaveBeenCalledOnce();
});

it('새 버전을 다 내려받으면 버전이 담긴 알림을 띄운다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: true,
    updateInfo: { version: '1.0.1' },
    downloadPromise: Promise.resolve(['smartstore-price-bot-1.0.1-setup.exe']),
  });

  await checkAppUpdate();

  expect(mockNotification).toHaveBeenCalledWith({
    title: 'A new update is ready to install',
    body: 'smartstore-price-bot version 1.0.1 has been downloaded and will be automatically installed on exit',
  });
  expect(mockShow).toHaveBeenCalledOnce();
});
