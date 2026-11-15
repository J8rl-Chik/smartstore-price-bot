import { app, Notification } from 'electron';
import { autoUpdater } from 'electron-updater';
import tryCatch from '../utils/tryCatch';

/**
 * 앱을 시작할 때 GitHub Releases에 새 버전이 있는지 확인한다.
 * 새 버전이 있으면 내려받고, 다 받으면 Windows 알림을 띄운다. 설치는 앱을 종료할 때 된다.
 * checkForUpdatesAndNotify는 다운로드 실패를 내부에서 처리하지 않아 처리되지 않은 rejection이 남으므로,
 * checkForUpdates로 확인하고 다운로드를 직접 기다린 뒤 알림을 띄운다.
 * 실패해도 앱은 계속 동작해야 하므로 에러를 던지지 않는다.
 * 실패 로그는 electron-updater가 기본으로 등록한 error 리스너가 console에 남기므로 여기서 다시 남기지 않는다.
 */
const checkAppUpdate = async (): Promise<void> => {
  /**
   * 확인 실패: 새 버전 정보(latest.yml)를 받아 오지 못한 경우다.
   * 예) 네트워크 끊김, GitHub 응답 오류·요청 제한, Release에 latest.yml이 없음, 앱의 app-update.yml을 읽지 못함
   */
  const [checkError, result] = await tryCatch(autoUpdater.checkForUpdates());

  if (checkError) {
    return;
  }

  /**
   * result가 null이면 패키징하지 않은 앱(개발 실행)이라 electron-updater가 확인을 건너뛴 경우다.
   * downloadPromise가 없으면 이미 최신 버전이라 내려받을 것이 없는 경우다.
   */
  if (!result?.downloadPromise) {
    return;
  }

  /**
   * 다운로드 실패: 새 버전이 있지만 설치 파일을 다 받지 못한 경우다.
   * 예) 내려받는 중 네트워크 끊김, 설치 파일의 sha512가 latest.yml과 다름, 임시 폴더에 쓰지 못함
   */
  const [downloadError] = await tryCatch(result.downloadPromise);

  // 새 버전이 있다는 걸 알았는데 받지 못했으므로, 앱을 다시 시작하면 다시 받는다는 것을 알린다.
  if (downloadError) {
    new Notification({
      title: 'Update download failed',
      body: `${app.name} version ${result.updateInfo.version} could not be downloaded. It will try again the next time the app starts.`,
    }).show();

    return;
  }

  // electron-updater의 checkForUpdatesAndNotify가 띄우던 기본 문구를 그대로 쓴다.
  new Notification({
    title: 'A new update is ready to install',
    body: `${app.name} version ${result.updateInfo.version} has been downloaded and will be automatically installed on exit`,
  }).show();
};

export default checkAppUpdate;
