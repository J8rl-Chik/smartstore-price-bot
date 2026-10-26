/**
 * error부터 cause를 따라가며 ErrorClass의 인스턴스를 찾아 반환한다. 없으면 undefined를 반환한다.
 * 중간 계층이 에러를 ERROR_MESSAGE로 감싸 던져도, 안쪽에 있는 특정 에러를 구분할 수 있게 한다.
 * cause가 서로를 가리키는 순환이 있어도 멈추도록 이미 확인한 에러는 다시 확인하지 않는다.
 */
const findErrorInCause = <T extends Error>(
  error: unknown,
  ErrorClass: new () => T,
): T | undefined => {
  const visitedErrors = new Set<Error>();
  let currentError = error;

  while (currentError instanceof Error && !visitedErrors.has(currentError)) {
    if (currentError instanceof ErrorClass) {
      return currentError;
    }

    visitedErrors.add(currentError);
    currentError = currentError.cause;
  }

  return undefined;
};

export default findErrorInCause;
