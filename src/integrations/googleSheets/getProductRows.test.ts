import { afterEach, describe, expect, it, vi } from 'vitest';
import getProductRows from './getProductRows.js';

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

describe('getProductRows', () => {
  afterEach(() => {
    mockValuesGet.mockReset();
  });

  it('시트에서 받은 문자열로 이루어진 행의 배열을 반환한다', async () => {
    const rowValues1 = ['상품A', 'url1'];
    const rowValues2 = ['상품B', 'url2'];

    mockValuesGet.mockResolvedValue({ data: { values: [rowValues1, rowValues2] } });

    await expect(getProductRows()).resolves.toEqual([rowValues1, rowValues2]);
  });

  it('data.values가 없으면 원인을 남기고 에러를 던진다', async () => {
    mockValuesGet.mockResolvedValue({ data: {} });

    await expect(getProductRows()).rejects.toMatchObject({
      message: 'Google Sheets에서 상품 목록을 가져오지 못했습니다.',
      cause: expect.objectContaining({ message: '시트에서 데이터를 가져오지 못했습니다.' }),
    });
  });

  it('Sheets API 호출이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const apiError = new Error('네트워크 오류');
    mockValuesGet.mockRejectedValue(apiError);

    await expect(getProductRows()).rejects.toMatchObject({
      message: 'Google Sheets에서 상품 목록을 가져오지 못했습니다.',
      cause: apiError,
    });
  });
});
