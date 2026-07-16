import { pathToFileURL } from 'node:url';

/**
 * importMetaUrl(호출한 모듈 자신의 위치)과 process.argv[1](node 실행 진입점 경로)이
 * 같으면 이 모듈이 직접 실행된 것이고, 다르면 다른 파일에 import되어 실행된 것이다.
 */
const isManualTestRun = (importMetaUrl: string): boolean =>
  importMetaUrl === pathToFileURL(process.argv[1]).href;

export default isManualTestRun;
