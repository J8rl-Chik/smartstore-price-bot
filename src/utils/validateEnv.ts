const validateEnv = (key: string): string => {
  // TODO: 현재는 코드에 고정된 키만 전달받아 안전하다. 추후 사용자 입력을 받게 되면 허용 키 검증이 필요하다.
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[key];

  if (!value) {
    throw new Error(`환경 변수 ${key}가 설정되지 않았습니다.`);
  }

  return value;
};

export default validateEnv;
