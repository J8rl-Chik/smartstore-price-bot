import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { is } from '@electron-toolkit/utils';

/**
 * 앱 창이 띄우는 renderer 페이지 주소. 창을 띄울 때와 IPC 발신자를 검사할 때 같은 값을 쓴다.
 * 개발 모드는 HMR을 쓰도록 electron-vite 개발 서버 주소를, 배포 빌드는 빌드한 index.html의 file 주소를 쓴다.
 */
export const getRendererURL = (): string => {
  const devServerURL = process.env['ELECTRON_RENDERER_URL'];

  if (is.dev && devServerURL) {
    return devServerURL;
  }

  return pathToFileURL(join(__dirname, '../renderer/index.html')).href;
};
