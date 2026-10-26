/**
 * main과 preload가 함께 쓰는 IPC 채널 이름.
 * exposeApi.ts에 두면 main이 이 값을 import할 때 contextBridge, @electron-toolkit/preload 같은 preload 전용 코드까지 딸려 오므로,
 * 값만 가져갈 수 있도록 다른 import가 없는 파일로 분리한다.
 */

import { IpcInvoke } from './_type';

// preload가 순회 시작을 요청하고 main이 처리하는 채널 이름
export const START_UPDATE_CHANNEL = 'startUpdate' satisfies keyof IpcInvoke;

// main이 순회 상태를 보내고 preload가 구독하는 채널 이름
export const UPDATE_STATE_CHANNEL = 'updateState';
