import 'dotenv/config';
import { google, type sheets_v4 } from 'googleapis';

const getSheetsResource = (): sheets_v4.Resource$Spreadsheets => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'config/googleSheetKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const { spreadsheets: sheetsResource } = google.sheets({ version: 'v4', auth });

  return sheetsResource;
};

const getSheetValues = (
  sheetsResource: sheets_v4.Resource$Spreadsheets,
  spreadsheetId: string,
  range: string,
) => sheetsResource.values.get({ spreadsheetId, range });

async function getProductRows(): Promise<string[][]> {
  const range = '!A2:L';
  const { SHEET_ID, SHEET_NAME } = process.env;

  try {
    const sheetsResource = getSheetsResource();
    const { data } = await getSheetValues(
      sheetsResource,
      SHEET_ID as string,
      `${SHEET_NAME}${range}`,
    );

    if (!data.values) {
      throw new Error('시트에서 데이터를 가져오지 못했습니다.');
    }

    return data.values;
  } catch (error) {
    throw new Error('Google Sheets에서 상품 목록을 가져오지 못했습니다.', { cause: error });
  }
}

export default getProductRows;
