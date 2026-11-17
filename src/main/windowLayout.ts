import type { Rectangle } from 'electron';
import type { WindowBounds } from 'puppeteer';

/**
 * 원격 PC 모니터(1920×1080)의 작업 영역을 좌우 절반으로 나눠, 수집 브라우저는 왼쪽, 앱 창은 오른쪽에 띄운다.
 * 높이는 작업 표시줄(48px)을 뺀 값이다. 1080을 그대로 주면 Puppeteer 브라우저는 작업 영역에 맞춰 줄지 않아 작업 표시줄에 가려진다.
 * 모니터 해상도, 작업 표시줄 크기, Windows 배율이 바뀌면 screen.getPrimaryDisplay().workArea로 확인해 이 값을 고친다.
 */
const workAreaWidth = 1920;
const workAreaHeight = 1032;
const halfWidth = workAreaWidth / 2;

export const BROWSER_WINDOW_BOUNDS: WindowBounds = {
  left: 0,
  top: 0,
  width: halfWidth,
  height: workAreaHeight,
};

export const APP_WINDOW_BOUNDS: Rectangle = {
  x: halfWidth,
  y: 0,
  width: halfWidth,
  height: workAreaHeight,
};
