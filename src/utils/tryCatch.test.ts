import { expect, it } from 'vitest';
import tryCatch from './tryCatch.js';

it('Promise가 resolve되면 에러 자리는 null, 값 자리는 resolve된 값을 반환한다', async () => {
  expect(await tryCatch(Promise.resolve('값'))).toEqual([null, '값']);
});

it('Promise가 reject되면 에러 자리는 reject된 에러, 값 자리는 null을 반환한다', async () => {
  const error = new Error('실패');

  expect(await tryCatch(Promise.reject(error))).toEqual([error, null]);
});
