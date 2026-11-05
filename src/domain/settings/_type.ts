/**
 * 사용자 설정 페이지에서 입력받아 localStorage에 저장하는 값.
 * restartDelayMinutes가 null이면 자동 재실행 없이 한 번만 순회한다.
 * isDryRun이 true이면 실제 가격을 수정하지 않는다.
 * encrypted로 시작하는 값은 main이 암호화한 base64 암호문이고, 입력한 적이 없으면 빈 문자열이다.
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
  encryptedNaverPassword: string;
  encryptedClientSecret: string;
  encryptedServiceAccountKey: string;
}

// 네이버 로그인에 쓰는 계정 정보
export interface NaverAccount {
  naverId: string;
  naverPassword: string;
}

// 커머스 API 토큰 발급에 쓰는 인증 정보
export interface CommerceApiCredentials {
  clientId: string;
  clientSecret: string;
}
