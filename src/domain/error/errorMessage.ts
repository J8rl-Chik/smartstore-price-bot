/**
 * 에러 코드와 사용자에게 보여줄 메시지를 한곳에서 관리한다.
 * main은 코드로 에러를 던지고, renderer는 코드로 메시지를 찾아 보여준다.
 * 화면에서 같은 메시지로 보이는 에러는 코드 하나로 합치고, 세부 원인은 에러의 cause로 남긴다.
 */
export const ERROR_MESSAGE = {
  // 환경 설정 (utils/validateEnv)
  ENV_NOT_SET: '환경 변수가 설정되지 않았습니다.',

  // 스마트스토어 API (integrations/smartStore)
  ACCESS_TOKEN_FAILED: '네이버 접근 토큰을 발급받지 못했습니다.',
  SMART_STORE_API_FAILED: '네이버 스마트스토어 API 요청에 실패했습니다.',
  SALE_PRODUCTS_FETCH_FAILED: '네이버 판매 상품 목록을 가져오지 못했습니다.',
  PRICE_UPDATE_FAILED: '네이버 상품 가격을 수정하지 못했습니다.',

  // 구글 시트 (integrations/googleSheets, domain/product)
  SHEET_FETCH_FAILED: 'Google Sheets에서 상품 목록을 가져오지 못했습니다.',
  SHEET_ROW_PARSE_FAILED: '시트의 상품 행을 읽지 못했습니다.',

  // 가격 (domain/price)
  PRICE_NOT_NUMBER: '가격을 숫자로 변환할 수 없습니다.',
  PRICE_NOT_INTEGER: '가격은 정수여야 합니다.',
  PRICE_NOT_POSITIVE: '가격은 0보다 커야 합니다.',

  // 배송비 (domain/delivery, domain/product)
  UNKNOWN_DELIVERY_FEE_TYPE: '알 수 없는 배송비 유형입니다.',

  // 브라우저·네이버 쇼핑 (integrations/puppeteer)
  BROWSER_PAGE_FAILED: '브라우저 페이지를 생성하지 못했습니다.',
  NAVER_LOGIN_FAILED: '네이버 로그인에 실패했습니다.',
  CATALOG_BLOCKED: '네이버 쇼핑 접속이 일시적으로 제한되었습니다.',
  SELLERS_FETCH_FAILED: '네이버 판매처 목록을 가져오지 못했습니다.',
  SELLERS_EMPTY: '가격 목록이 없습니다.',
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGE;
