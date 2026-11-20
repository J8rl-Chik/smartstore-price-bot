import { is } from '@electron-toolkit/utils';
import { APP_ORIGIN } from './appOrigin';

// 개발 모드에서 HMR을 쓰도록 electron-vite가 넣어 주는 개발 서버 주소. 배포 빌드거나 주소가 없으면 null.
const getDevServerURL = (): string | null => {
  const devServerURL = process.env['ELECTRON_RENDERER_URL'];

  return is.dev && devServerURL ? devServerURL : null;
};

/**
 * 앱 창이 띄우는 renderer 페이지 주소.
 * 개발 모드는 electron-vite 개발 서버 주소를, 배포 빌드는 커스텀 프로토콜(app://renderer/)의 index.html을 쓴다.
 */
export const getRendererURL = (): string => getDevServerURL() ?? `${APP_ORIGIN}/index.html`;

/**
 * renderer 페이지의 origin. IPC 발신자를 검사할 때 요청한 프레임의 origin과 비교한다.
 * 개발 모드: 'http://localhost:5173', 배포 빌드: 'app://renderer'
 */
export const getRendererOrigin = (): string => {
  const devServerURL = getDevServerURL();

  return devServerURL ? new URL(devServerURL).origin : APP_ORIGIN;
};
