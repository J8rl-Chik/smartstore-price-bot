import 'dotenv/config';
import { google } from 'googleapis';

import { COLUMN } from './constant.js';
import isManualTestRun from '../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${productRows.length}개`);
  });
}

export default async function getProductRows() {
  const range = '!A2:L';
  const columnCount = 12; // A~L
  const { SHEET_ID, SHEET_NAME } = process.env;
  const sheetsResource = await getSheetsResource();
  /**
   * TODO: 네트워크 오류, 인증 실패, 잘못된 range, 권한 없음 등에 대한 try/catch 필요.
   * 현재는 예외가 그대로 전파되어 호출부(userScenario.js)에서 unhandled rejection이 됨.
   */
  const { data } = await getSheetValues(sheetsResource, SHEET_ID, `${SHEET_NAME}${range}`);

  /**
   * TODO: 시트 범위에 데이터가 하나도 없으면 Sheets API 응답에 values 키 자체가 없을 수 있어
   * data.values가 undefined일 수 있음. 빈 배열 등으로 방어 처리 필요.
   */
  return (
    data.values
      .map((row) => Array.from({ length: columnCount }, (_, columnIndex) => row[columnIndex] ?? ''))
      /**
       * TODO: ACTIVATE 컬럼이 체크박스 형식이면 Sheets API가 'TRUE' 문자열이 아니라
       * boolean true를 반환해 이 비교가 항상 false가 될 수 있음. 실제 시트 컬럼 형식 확인 필요.
       */
      .filter((productColumns) => productColumns[COLUMN.ACTIVATE] === 'TRUE')
  );
}

async function getSheetsResource() {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'google/googleSheetKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const authClient = await auth.getClient();
  const { spreadsheets: sheetsResource } = google.sheets({
    version: 'v4',
    auth: authClient,
  });

  return sheetsResource;
}

async function getSheetValues(sheetsResource, spreadsheetId, range) {
  const getRows = await sheetsResource.values.get({
    spreadsheetId,
    range,
  });

  return getRows;
}
