import { app } from 'electron';

/**
 * 시작 프로그램으로 켜졌을 때만 붙는 실행 인자.
 * Windows에는 시작 프로그램으로 켜졌는지 알려 주는 값(wasOpenedAtLogin, macOS 전용)이 없어서,
 * 등록할 때 이 인자를 붙이고 실행될 때 process.argv에 있는지로 구분한다.
 */
const openedAtLoginArg = '--opened-at-login';

/**
 * Windows 시작 프로그램에 등록돼 있는지 확인한다. 작업 관리자에서 끈 것도 반영된다.
 * 등록할 때 붙인 인자와 같은 args를 넘겨야 openAtLogin이 제대로 나온다.
 */
export const isOpenAtLoginEnabled = (): boolean =>
  app.getLoginItemSettings({ args: [openedAtLoginArg] }).openAtLogin;

/**
 * 켜면 시작 프로그램으로 켜졌다는 인자를 붙여 Windows 시작 프로그램에 등록하고, 끄면 해제한다.
 * 개발 실행에서는 실행 파일이 electron.exe라 그게 등록되므로 패키징한 앱에서만 바꾼다.
 */
export const setOpenAtLogin = (isEnabled: boolean): void => {
  if (!app.isPackaged) {
    return;
  }

  app.setLoginItemSettings({ openAtLogin: isEnabled, args: [openedAtLoginArg] });
};

// 이번 실행이 Windows 시작 프로그램으로 켜진 것인지 확인한다. 사람이 바로가기로 켜면 인자가 없다.
export const isOpenedAtLogin = (): boolean => process.argv.includes(openedAtLoginArg);
