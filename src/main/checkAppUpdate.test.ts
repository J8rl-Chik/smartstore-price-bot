import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mockCheckForUpdates = vi.fn();
const mockNotification = vi.fn();
const mockShow = vi.fn();

// checkAppUpdate가 바꾸는 설정 값을 테스트에서 확인할 수 있도록 같은 객체를 넘긴다.
const mockAutoUpdater = {
  autoInstallOnAppQuit: true,
  autoRunAppAfterInstall: true,
  checkForUpdates: () => mockCheckForUpdates(),
};

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

vi.mock('electron-updater', () => ({ autoUpdater: mockAutoUpdater }));

// 내려받았는지를 모듈 최상위에 보관하므로, 테스트끼리 섞이지 않도록 테스트마다 모듈을 새로 불러온다.
beforeEach(() => {
  vi.resetModules();
  mockAutoUpdater.autoInstallOnAppQuit = true;
  mockAutoUpdater.autoRunAppAfterInstall = true;
});

afterEach(() => {
  mockCheckForUpdates.mockReset();
  mockNotification.mockReset();
  mockShow.mockReset();
});

const importCheckAppUpdate = () => import('./checkAppUpdate');

it('앱을 끌 때 조용히 설치하지 않고, 설치가 끝난 뒤 앱을 다시 실행하지 않도록 설정한다', async () => {
  mockCheckForUpdates.mockResolvedValue(null);
  const { default: checkAppUpdate } = await importCheckAppUpdate();

  await checkAppUpdate();

  expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(false);
  expect(mockAutoUpdater.autoRunAppAfterInstall).toBe(false);
});

it('확인하기 전에는 내려받은 새 버전이 없다', async () => {
  const { hasDownloadedAppUpdate } = await importCheckAppUpdate();

  expect(hasDownloadedAppUpdate()).toBe(false);
});

it('확인에 실패하면 에러를 던지지 않고 알림도 띄우지 않는다', async () => {
  mockCheckForUpdates.mockRejectedValue(new Error('네트워크 오류'));
  const { default: checkAppUpdate, hasDownloadedAppUpdate } = await importCheckAppUpdate();

  await expect(checkAppUpdate()).resolves.toBeUndefined();
  expect(mockShow).not.toHaveBeenCalled();
  expect(hasDownloadedAppUpdate()).toBe(false);
});

it('패키징하지 않은 앱이라 확인을 건너뛰면 알림을 띄우지 않는다', async () => {
  mockCheckForUpdates.mockResolvedValue(null);
  const { default: checkAppUpdate, hasDownloadedAppUpdate } = await importCheckAppUpdate();

  await checkAppUpdate();

  expect(mockShow).not.toHaveBeenCalled();
  expect(hasDownloadedAppUpdate()).toBe(false);
});

it('이미 최신 버전이면 알림을 띄우지 않는다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: false,
    updateInfo: { version: '1.0.0' },
  });
  const { default: checkAppUpdate, hasDownloadedAppUpdate } = await importCheckAppUpdate();

  await checkAppUpdate();

  expect(mockShow).not.toHaveBeenCalled();
  expect(hasDownloadedAppUpdate()).toBe(false);
});

it('내려받기에 실패하면 에러를 던지지 않고 실패 알림을 띄운다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: true,
    updateInfo: { version: '1.0.1' },
    downloadPromise: Promise.reject(new Error('다운로드 중 네트워크 오류')),
  });
  const { default: checkAppUpdate, hasDownloadedAppUpdate } = await importCheckAppUpdate();

  await expect(checkAppUpdate()).resolves.toBeUndefined();
  expect(mockNotification).toHaveBeenCalledWith({
    title: 'Update download failed',
    body: 'smartstore-price-bot version 1.0.1 could not be downloaded. It will try again the next time the app starts.',
  });
  expect(mockShow).toHaveBeenCalledOnce();
  expect(hasDownloadedAppUpdate()).toBe(false);
});

it('새 버전을 다 내려받으면 버전이 담긴 알림을 띄우고 내려받은 상태가 된다', async () => {
  mockCheckForUpdates.mockResolvedValue({
    isUpdateAvailable: true,
    updateInfo: { version: '1.0.1' },
    downloadPromise: Promise.resolve(['smartstore-price-bot-1.0.1-setup.exe']),
  });
  const { default: checkAppUpdate, hasDownloadedAppUpdate } = await importCheckAppUpdate();

  await checkAppUpdate();

  expect(mockNotification).toHaveBeenCalledWith({
    title: 'A new update is ready to install',
    body: 'smartstore-price-bot version 1.0.1 has been downloaded and will be automatically installed on exit',
  });
  expect(mockShow).toHaveBeenCalledOnce();
  expect(hasDownloadedAppUpdate()).toBe(true);
});
