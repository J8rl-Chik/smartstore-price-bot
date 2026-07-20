import "dotenv/config";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";

import { COLUMN_COUNT, COLUMN, RANGE } from "./constant.js";

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${productRows.length}개`);
  });
}

export default async function getProductRows() {
  const { SHEET_ID, SHEET_NAME } = process.env;
  const sheetsResource = await getSheetsResource();
  const { data } = await getSheetValues(
    sheetsResource,
    SHEET_ID,
    `${SHEET_NAME}${RANGE}`,
  );

  return data.values
    .map((row) =>
      Array.from(
        { length: COLUMN_COUNT },
        (_, columnIndex) => row[columnIndex] ?? "",
      ),
    )
    .filter((productColumns) => productColumns[COLUMN.ACTIVATE] === "TRUE");
}

async function getSheetsResource() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "google/googleSheetKey.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  const authClient = await auth.getClient();
  const { spreadsheets: sheetsResource } = google.sheets({
    version: "v4",
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
