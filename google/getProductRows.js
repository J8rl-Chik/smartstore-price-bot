import "dotenv/config";
import { google } from "googleapis";

getProductRows().then(console.log);

async function getProductRows() {
  const productSheet = await getProductSheet();
  const CHECK_INDEX = 3;
  const START_INDEX = 1;

  return productSheet
    .slice(START_INDEX) // 0번 행은 타이틀 행
    .filter((productItems) => productItems[CHECK_INDEX] === "TRUE");
}

async function getProductSheet() {
  const SHEET_ID = process.env.SHEET_ID;
  const SHEET_NAME = process.env.SHEET_NAME;
  const sheetsResource = await getSheetsResource();
  const productSheet = await getSheetValues(
    sheetsResource,
    SHEET_ID,
    SHEET_NAME,
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

export { getProductRows };
