import "dotenv/config";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  getProductRows().then(([productRow]) => {
    console.log(`getProductRows 함수 테스트: ${productRow}`);
  });
}

export default async function getProductRows() {
  const productSheet = await getProductSheet();
  const CHECK_INDEX = 3;
  const START_INDEX = 1;

  return productSheet.filter(
    (productItems) => productItems[CHECK_INDEX] === "TRUE",
  );
}

async function getProductSheet() {
  const SHEET_ID = process.env.SHEET_ID;
  const SHEET_NAME = process.env.SHEET_NAME;
  const sheetsResource = await getSheetsResource();
  const productSheet = await getSheetValues(
    sheetsResource,
    SHEET_ID,
    `${SHEET_NAME}!A2:M`, // 1번 행은 타이틀 행, 현재 M 칼럼까지만 사용 중
  );

  return productSheet.data.values;
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
