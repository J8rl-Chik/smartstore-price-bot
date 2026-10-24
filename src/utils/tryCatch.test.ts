import { expect, it } from 'vitest';
import tryCatch from './tryCatch.js';
import { ERROR_MESSAGE } from '../domain/error/errorMessage.js';

it('Promise가 resolve되면 에러 자리는 null, 값 자리는 resolve된 값을 반환한다', async () => {
  expect(await tryCatch(Promise.resolve('값'))).toEqual([null, '값']);
});

it('Promise가 reject되면 에러 자리는 reject된 에러, 값 자리는 null을 반환한다', async () => {
  const error = new Error('실패');

  expect(await tryCatch(Promise.reject(error))).toEqual([error, null]);
});

it('Error가 아닌 값이 reject되면 알 수 없는 에러 메시지의 Error로 감싸고 원래 값을 cause에 담는다', async () => {
  const [error, value] = await tryCatch(Promise.reject('문자열 에러'));

  expect(error).toBeInstanceOf(Error);
  expect(error).toMatchObject({ message: ERROR_MESSAGE.UNKNOWN_ERROR, cause: '문자열 에러' });
  expect(value).toBeNull();
});
