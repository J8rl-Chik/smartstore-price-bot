import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { isOpenAtLoginEnabled, isOpenedAtLogin, setOpenAtLogin } from './openAtLogin';

const mockGetLoginItemSettings = vi.fn();
const mockSetLoginItemSettings = vi.fn();
let isPackaged = true;

vi.mock('electron', () => ({
  app: {
    // 테스트마다 패키징 여부를 바꾸므로, 읽는 시점의 값을 돌려준다.
    get isPackaged() {
      return isPackaged;
    },
    getLoginItemSettings: (...args: unknown[]) => mockGetLoginItemSettings(...args),
    setLoginItemSettings: (...args: unknown[]) => mockSetLoginItemSettings(...args),
  },
}));

// 테스트마다 실행 인자를 바꾸므로, 원래 값을 보관했다가 되돌린다.
const originalArgv = process.argv;

beforeEach(() => {
  isPackaged = true;
});

afterEach(() => {
  process.argv = originalArgv;
  mockGetLoginItemSettings.mockReset();
  mockSetLoginItemSettings.mockReset();
});

it('시작 프로그램에 등록돼 있으면 isOpenAtLoginEnabled가 true를 반환한다', () => {
  mockGetLoginItemSettings.mockReturnValue({ openAtLogin: true });

  expect(isOpenAtLoginEnabled()).toBe(true);
});

it('시작 프로그램에 등록돼 있지 않으면 isOpenAtLoginEnabled가 false를 반환한다', () => {
  mockGetLoginItemSettings.mockReturnValue({ openAtLogin: false });

  expect(isOpenAtLoginEnabled()).toBe(false);
});

it('등록 상태를 읽을 때 등록할 때와 같은 실행 인자를 넘긴다', () => {
  mockGetLoginItemSettings.mockReturnValue({ openAtLogin: true });

  isOpenAtLoginEnabled();

  expect(mockGetLoginItemSettings).toHaveBeenCalledWith({ args: ['--opened-at-login'] });
});

it('켜면 시작 프로그램으로 켜졌다는 실행 인자를 붙여 등록한다', () => {
  setOpenAtLogin(true);

  expect(mockSetLoginItemSettings).toHaveBeenCalledWith({
    openAtLogin: true,
    args: ['--opened-at-login'],
  });
});

it('끄면 시작 프로그램에서 해제한다', () => {
  setOpenAtLogin(false);

  expect(mockSetLoginItemSettings).toHaveBeenCalledWith({
    openAtLogin: false,
    args: ['--opened-at-login'],
  });
});

it('패키징하지 않은 앱이면 시작 프로그램 등록을 바꾸지 않는다', () => {
  isPackaged = false;

  setOpenAtLogin(true);

  expect(mockSetLoginItemSettings).not.toHaveBeenCalled();
});

it('실행 인자에 시작 프로그램 인자가 있으면 isOpenedAtLogin이 true를 반환한다', () => {
  process.argv = ['smartstore-price-bot.exe', '--opened-at-login'];

  expect(isOpenedAtLogin()).toBe(true);
});

it('실행 인자에 시작 프로그램 인자가 없으면 isOpenedAtLogin이 false를 반환한다', () => {
  process.argv = ['smartstore-price-bot.exe'];

  expect(isOpenedAtLogin()).toBe(false);
});
