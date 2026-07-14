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
  const { data } = await getSheetValues(sheetsResource, SHEET_ID, `${SHEET_NAME}${range}`);

  return data.values
    .map((row) => Array.from({ length: columnCount }, (_, columnIndex) => row[columnIndex] ?? ''))
    .filter((productColumns) => productColumns[COLUMN.ACTIVATE] === 'TRUE');
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
