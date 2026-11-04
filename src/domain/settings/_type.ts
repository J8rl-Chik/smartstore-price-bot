/**
 * 사용자 설정 페이지에서 입력받아 localStorage에 저장하는 값.
 * restartDelayMinutes가 null이면 자동 재실행 없이 한 번만 순회한다.
 * isDryRun이 true이면 실제 가격을 수정하지 않는다.
 */
export interface Settings {
  naverId: string;
  storeName: string;
  clientId: string;
  sheetId: string;
  sheetName: string;
  restartDelayMinutes: number | null;
  productDelaySeconds: number;
  isDryRun: boolean;
}
