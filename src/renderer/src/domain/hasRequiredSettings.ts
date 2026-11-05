import type { Settings } from '../../../domain/settings/_type';

// 순회에 꼭 필요한 값이 모두 있는지 확인한다. 순회 간격, 대기 시간, 테스트 모드는 기본값이 있어 필수가 아니다.
const hasRequiredSettings = ({
  naverId,
  storeName,
  clientId,
  sheetId,
  sheetName,
  encryptedNaverPassword,
  encryptedClientSecret,
  encryptedServiceAccountKey,
}: Settings): boolean =>
  [
    naverId,
    storeName,
    clientId,
    sheetId,
    sheetName,
    encryptedNaverPassword,
    encryptedClientSecret,
    encryptedServiceAccountKey,
  ].every((value) => value !== '');

export default hasRequiredSettings;
