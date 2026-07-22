import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import isManualTestRun from './isManualTestRun.js';

describe('isManualTestRun', () => {
  const originalArgv1 = process.argv[1];

  afterEach(() => {
    // 테스트 실행 환경에서는 항상 실제 진입점 경로가 있으므로 string 타입으로 가정한다.
    process.argv[1] = originalArgv1 as string;
  });

  it('node로 직접 실행된 파일이면 true를 반환한다', () => {
    process.argv[1] = 'D:/scripts/app.js';

    expect(isManualTestRun(pathToFileURL(process.argv[1]).href)).toBe(true);
  });

  it('다른 모듈에서 import되어 실행된 경우 false를 반환한다', () => {
    process.argv[1] = 'D:/scripts/app.js';

    expect(isManualTestRun(pathToFileURL('D:/scripts/other.js').href)).toBe(false);
  });

  it('진입점 경로(argv[1])가 없으면 false를 반환한다', () => {
    delete process.argv[1];

    expect(isManualTestRun('file:///D:/scripts/app.js')).toBe(false);
  });
});
