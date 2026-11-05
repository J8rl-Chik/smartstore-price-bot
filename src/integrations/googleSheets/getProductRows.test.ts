import { google } from 'googleapis';
import { afterEach, expect, it, vi } from 'vitest';
import getProductRows from './getProductRows.js';
import { COLUMN } from '../../domain/product/_constant.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

const mockValuesGet = vi.fn();

vi.mock('googleapis', () => ({
  google: {
    auth: {
      GoogleAuth: vi.fn(),
    },
    sheets: vi.fn(() => ({
      spreadsheets: {
        values: {
          get: mockValuesGet,
        },
      },
    })),
  },
}));

afterEach(() => {
  mockValuesGet.mockReset();
});

const googleSheetConfig = {
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  auth: { keyFile: 'key.json' },
};

it('시트에서 받은 행마다 값을 칸 위치 그대로 유지한다', async () => {
  const fullRowValues = Array.from({ length: 12 }, (_, columnIndex) => `값${columnIndex}`).with(
    COLUMN.activate,
    'TRUE',
  );

  mockValuesGet.mockResolvedValue({ data: { values: [fullRowValues] } });

  await expect(getProductRows(googleSheetConfig)).resolves.toEqual([fullRowValues]);
});

it('행 끝의 빈 셀이 생략된 짧은 행은 12칸이 되도록 빈 문자열로 채운다', async () => {
  mockValuesGet.mockResolvedValue({ data: { values: [['상품A', 'url1', 'TRUE']] } });

  const [productRow] = await getProductRows(googleSheetConfig);

  expect(productRow).toHaveLength(12);
  expect(productRow?.slice(0, 3)).toEqual(['상품A', 'url1', 'TRUE']);
  expect(productRow?.slice(3).every((cell) => cell === '')).toBe(true);
});

it('activate 칸이 TRUE인 행만 반환한다', async () => {
  mockValuesGet.mockResolvedValue({
    data: {
      values: [
        ['상품A', 'url1', 'TRUE'],
        ['상품B', 'url2', 'FALSE'],
        ['상품C', 'url3'],
      ],
    },
  });

  const productRows = await getProductRows(googleSheetConfig);

  expect(productRows.map((productRow) => productRow[COLUMN.name])).toEqual(['상품A']);
});

it('data.values가 없으면 원인을 남기고 에러를 던진다', async () => {
  mockValuesGet.mockResolvedValue({ data: {} });

  await expect(getProductRows(googleSheetConfig)).rejects.toMatchObject({
    message: ERROR_MESSAGE.SHEET_FETCH_FAILED,
    cause: expect.objectContaining({ message: '시트에서 데이터를 가져오지 못했습니다.' }),
  });
});

it('Sheets API 호출이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
  const apiError = new Error('네트워크 오류');
  mockValuesGet.mockRejectedValue(apiError);

  await expect(getProductRows(googleSheetConfig)).rejects.toMatchObject({
    message: ERROR_MESSAGE.SHEET_FETCH_FAILED,
    cause: apiError,
  });
});

it('전달받은 시트 ID와 시트 이름으로 첫 행을 뺀 범위를 조회한다', async () => {
  mockValuesGet.mockResolvedValue({ data: { values: [] } });

  await getProductRows(googleSheetConfig);

  expect(mockValuesGet).toHaveBeenCalledWith({
    spreadsheetId: 'sheet-id',
    range: '상품 목록!A2:L',
  });
});

it('키 파일 경로를 받으면 keyFile로 인증한다', async () => {
  mockValuesGet.mockResolvedValue({ data: { values: [] } });

  await getProductRows(googleSheetConfig);

  expect(google.auth.GoogleAuth).toHaveBeenLastCalledWith({
    keyFile: 'key.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
});

it('키 내용을 받으면 credentials로 인증한다', async () => {
  const credentials = { client_email: 'bot@example.com', private_key: 'private-key' };

  mockValuesGet.mockResolvedValue({ data: { values: [] } });

  await getProductRows({ ...googleSheetConfig, auth: { credentials } });

  expect(google.auth.GoogleAuth).toHaveBeenLastCalledWith({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
});
