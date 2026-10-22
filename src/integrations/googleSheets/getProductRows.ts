import 'dotenv/config';
import { google, type sheets_v4 } from 'googleapis';
import { COLUMN } from '../../domain/product/parseRawProductRow.js';
import type { RowValues } from '../../domain/product/_type.js';

const getSheetsResource = (): sheets_v4.Resource$Spreadsheets => {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'config/googleSheetKey.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const { spreadsheets: sheetsResource } = google.sheets({ version: 'v4', auth });

  return sheetsResource;
};

const getSheetValues = async (
  sheetsResource: sheets_v4.Resource$Spreadsheets,
  spreadsheetId: string,
  range: string,
): Promise<{ data: sheets_v4.Schema$ValueRange }> =>
  sheetsResource.values.get({ spreadsheetId, range });

// 시트의 activate 칸이 TRUE인 행만 가격 수정 대상이다.
const isActiveRow = (row: RowValues): boolean => row[COLUMN.activate] === 'TRUE';

async function getProductRows(): Promise<RowValues[]> {
  // 첫 번째 칼럼 행(제목, URL 등등) 제외
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

    /**
     * Sheets API는 행 끝의 빈 셀을 생략해 행마다 길이가 다르다.
     * range의 A~L 12칸에 맞춰 부족한 칸을 빈 문자열로 채운다.
     */
    const columnLength = 12;

    return data.values
      .map((row: string[]) => {
        const filledRowValues = Array.from(
          { length: columnLength },
          (_, columnIndex) => row.at(columnIndex) ?? '',
        );

        return filledRowValues as RowValues;
      })
      .filter(isActiveRow);
  } catch (error) {
    throw new Error('Google Sheets에서 상품 목록을 가져오지 못했습니다.', { cause: error });
  }
}

export default getProductRows;
