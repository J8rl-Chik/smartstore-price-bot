import { expect, it } from 'vitest';
import findErrorInCause from './findErrorInCause.js';

class TargetError extends Error {}

it('error가 ErrorClass의 인스턴스면 error를 그대로 반환한다', () => {
  const error = new TargetError('대상 에러');

  expect(findErrorInCause(error, TargetError)).toBe(error);
});

it('cause에 ErrorClass의 인스턴스가 있으면 그 에러를 반환한다', () => {
  const targetError = new TargetError('대상 에러');
  const error = new Error('바깥 에러', { cause: targetError });

  expect(findErrorInCause(error, TargetError)).toBe(targetError);
});

it('여러 단계로 감싼 cause 안의 ErrorClass 인스턴스도 찾는다', () => {
  const targetError = new TargetError('대상 에러');
  const error = new Error('바깥 에러', { cause: new Error('중간 에러', { cause: targetError }) });

  expect(findErrorInCause(error, TargetError)).toBe(targetError);
});

it('cause를 끝까지 따라가도 ErrorClass의 인스턴스가 없으면 undefined를 반환한다', () => {
  const error = new Error('바깥 에러', { cause: new Error('원인 에러') });

  expect(findErrorInCause(error, TargetError)).toBeUndefined();
});

it('cause가 Error가 아닌 값이면 더 따라가지 않고 undefined를 반환한다', () => {
  const error = new Error('바깥 에러', { cause: '문자열 원인' });

  expect(findErrorInCause(error, TargetError)).toBeUndefined();
});

it('error가 Error가 아닌 값이면 undefined를 반환한다', () => {
  expect(findErrorInCause('문자열 에러', TargetError)).toBeUndefined();
  expect(findErrorInCause(null, TargetError)).toBeUndefined();
});

it('cause가 순환해도 멈추고 undefined를 반환한다', () => {
  const firstError = new Error('첫 번째 에러');
  const secondError = new Error('두 번째 에러', { cause: firstError });
  firstError.cause = secondError;

  expect(findErrorInCause(firstError, TargetError)).toBeUndefined();
});
