import { describe, expect, it, vi } from 'vitest';

import shuffleArray from './shuffleArray.js';

describe('shuffleArray', () => {
  it('배열 요소들의 순서를 섞는다', () => {
    const array = [1, 2, 3];

    expect(shuffleArray(array)).toEqual(expect.arrayContaining(array));
  });

  it('배열을 섞는 후 길이가 같다.', () => {
    const array = [1, 2, 3];

    expect(shuffleArray(array)).toHaveLength(array.length);
  });

  it('원본 배열을 변경하지 않는다.', () => {
    const array = [1, 2, 3];
    shuffleArray(array);

    expect(array).toEqual([1, 2, 3]);
  });

  it('undefined가 있으면 에러 처리', () => {
    const array = [1, 2, undefined];

    expect(() => shuffleArray(array)).toThrow('배열 인덱스 범위를 벗어났습니다.');
  });

  it('', () => {
    const spy = vi.spyOn(Math, 'random');

    spy.mockReturnValueOnce(0.8);
    spy.mockReturnValueOnce(0);
    spy.mockReturnValueOnce(0.3);

    const array = [1, 2, 3];

    expect(shuffleArray(array)).toEqual([2, 1, 3]);

    spy.mockRestore();
  });
});
