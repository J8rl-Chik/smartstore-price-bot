// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널과
// 각 채널의 요청 인자(args), 응답 타입(result)을 정의한다.
export interface IpcChannels {
  ping: { args: []; result: string };
}
