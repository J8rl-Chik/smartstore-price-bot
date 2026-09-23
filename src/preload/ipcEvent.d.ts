// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널과
// 각 채널의 요청 인자(args), 응답 타입(returnType)을 정의한다.
// args는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcEvent {
  ping: { args: []; returnType: string };
}
