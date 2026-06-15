import "dotenv/config";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${productRows.length}개`);
  });
}

export default async function getProductRows() {
  const SHEET_ID = process.env.SHEET_ID;
  const SHEET_NAME = process.env.SHEET_NAME;
  const COLUMN_COUNT = 12; // A~L
  const sheetsResource = await getSheetsResource();
  const productSheet = await getSheetValues(
    sheetsResource,
    SHEET_ID,
    `${SHEET_NAME}!A2:L`, // 1번 행은 타이틀 행, 현재 L 칼럼까지만 사용 중
  );

  const ACTIVATE_INDEX = 1;

  return productSheet.data.values
    .map((row) => Array.from({ length: COLUMN_COUNT }, (_, i) => row[i] ?? ""))
    .filter((productItems) => productItems[ACTIVATE_INDEX] === "TRUE");
}

async function getSheetsResource() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "google/googleSheetKey.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();
  const { spreadsheets } = google.sheets({ version: "v4", auth: authClient });

  return spreadsheets;
}

async function getSheetValues(sheetsResource, spreadsheetId, range) {
  const getRows = await sheetsResource.values.get({
    spreadsheetId,
    range,
  });

  return getRows;
}
