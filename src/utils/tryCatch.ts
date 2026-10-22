// Promise의 결과를 [에러, 값] 형태로 바꿔, 호출하는 쪽이 try/catch 없이 분기할 수 있게 한다.
const tryCatch = async <T>(promise: Promise<T>): Promise<[unknown, null] | [null, T]> => {
  try {
    return [null, await promise];
  } catch (error) {
    return [error, null];
  }
};

export default tryCatch;
