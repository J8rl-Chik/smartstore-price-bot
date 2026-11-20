/**
 * renderer 페이지를 띄우는 커스텀 프로토콜(app://renderer/)의 스킴, 호스트, origin.
 * appProtocol(요청 처리)과 rendererURL(창 주소, IPC 발신자 검사)이 함께 쓴다.
 * 두 파일 모두 electron을 불러오므로, 값만 가져갈 수 있도록 다른 import가 없는 파일로 분리한다.
 */
export const APP_SCHEME = 'app';
export const APP_HOST = 'renderer';

/**
 * standard 스킴으로 등록하면 Chromium이 frame.origin을 이 값으로 준다.
 * Node의 new URL('app://renderer/').origin은 모르는 스킴이라 'null'을 주므로, 계산하지 않고 직접 만든다.
 */
export const APP_ORIGIN = `${APP_SCHEME}://${APP_HOST}`;
