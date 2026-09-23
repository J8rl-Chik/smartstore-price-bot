import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { IpcChannels } from '../preload/ipcChannels';

// 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼
const handleIpc = <K extends keyof IpcChannels>(
  channel: K,
  listener: (
    ...args: IpcChannels[K]['args']
  ) => IpcChannels[K]['result'] | Promise<IpcChannels[K]['result']>,
): void => {
  ipcMain.handle(channel, (_event, ...args) => listener(...(args as IpcChannels[K]['args'])));
};

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 1024,
    // 우선 화면에 띄우지 않고 백그라운드에서 로딩합니다.
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
    },
  });

  mainWindow.on('ready-to-show', () => {
    // 로딩이 완전히 끝나면 그때 화면을 보여줍니다.
    mainWindow.show();
  });

  // window.open()을 실행하거나, <a target="_blank"> 링크를 클릭해서 새 창이 열렸을 때의 이벤트 핸들러.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // 운영체제(OS)의 기본 브라우저로 연다.
    shell.openExternal(details.url);

    // Electron 앱 내부에서 새 창 열기를 취소한다.
    return { action: 'deny' };
  });

  // 실시간 새로고침(HMR) 사용하기 위한 설정
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// Electron 앱이 구동될 준비가 완벽히 끝났을 때
app.whenReady().then(() => {
  /* 
    Windows 운영체제에서 앱의 고유 식별자(ID)를 등록하는 코드입니다.
    Windows 환경과 앱의 원활한 소통을 위해 설정(시스템 알림(Toast Notification)등)
  */
  electronApp.setAppUserModelId('com.electron');

  //  프로덕션 환경에서 사용자가 단축키로 개발자 도구를 켜지 못하도록 차단, 새로고침(Ctrl + R) 무시
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // IPC test
  handleIpc('ping', () => {
    console.log('pong');

    return 'pong';
  });

  createWindow();

  // macOS: 하단의 앱 아이콘을 다시 클릭했을 때, 열려있는 창이 하나도 없다면 새로운 창을 다시 만들어준다.
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 윈도우 및 리눅스: 모든 창을 닫았을 때 프로그램을 완전히 종료한다.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
