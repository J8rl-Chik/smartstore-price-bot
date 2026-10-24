import { ERROR_MESSAGE } from '../domain/error/errorMessage.js';

// Promise의 결과를 [에러, 값] 형태로 바꿔, 호출하는 쪽이 try/catch 없이 분기할 수 있게 한다.
const tryCatch = async <T>(promise: Promise<T>): Promise<[Error, null] | [null, T]> => {
  try {
    return [null, await promise];
  } catch (error) {
    // Error가 아닌 값이 던져져도 호출하는 쪽이 message를 읽을 수 있도록 Error로 감싸고, 원래 값은 cause로 남긴다.
    return [
      error instanceof Error ? error : new Error(ERROR_MESSAGE.UNKNOWN_ERROR, { cause: error }),
      null,
    ];
  }
};

export default tryCatch;
