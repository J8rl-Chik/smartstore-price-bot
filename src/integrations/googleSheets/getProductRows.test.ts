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

  it('시트에서 받은 행마다 값을 칸 위치 그대로 유지한다', async () => {
    const fullRowValues = Array.from({ length: 12 }, (_, columnIndex) => `값${columnIndex}`);

    mockValuesGet.mockResolvedValue({ data: { values: [fullRowValues] } });

    await expect(getProductRows()).resolves.toEqual([fullRowValues]);
  });

  it('행 끝의 빈 셀이 생략된 짧은 행은 12칸이 되도록 빈 문자열로 채운다', async () => {
    mockValuesGet.mockResolvedValue({ data: { values: [['상품A', 'url1']] } });

    const [productRow] = await getProductRows();

    expect(productRow).toHaveLength(12);
    expect(productRow?.slice(0, 2)).toEqual(['상품A', 'url1']);
    expect(productRow?.slice(2).every((cell) => cell === '')).toBe(true);
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
