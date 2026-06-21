# smartstore-price-bot

네이버 스마트스토어 가격을 자동으로 경쟁사보다 낮게 유지해주는 봇입니다.  
구글 시트에 등록된 제품 목록을 기준으로, 네이버 쇼핑 카탈로그를 크롤링해 경쟁 판매처의 가격을 수집하고, 스마트스토어 API로 가격을 업데이트합니다.

## 실행 흐름

```mermaid
flowchart TD
    A([start]) --> B[getSaleProducts\n네이버 커머스 API\n판매 중인 상품 목록 조회]
    A --> C[getProductRows\n구글 시트\n활성화된 제품 행 조회]
    A --> D[createPage\nPuppeteer\nChrome 브라우저 실행]
    B & C & D --> E[naverLogin\n네이버 계정 로그인]

    E --> F{상품별 루프\nfor each saleProduct}

    F --> G{구글 시트에서\n매칭 제품 탐색}
    G -- 없음 --> F
    G -- 있음 --> H[getPricesInPuppeteer\n네이버 쇼핑 카탈로그 크롤링\n판매처별 가격 수집]

    H --> I{가격 목록\n비어있음?}
    I -- Yes --> F
    I -- No --> J[가격 계산\n제외 판매처 필터링\n가상 판매처 추가\n오름차순 정렬]

    J --> K[targetPrice 결정\nfreeDeliveryPrice + 10 이상인\n최저가 - 10원]

    K --> L{내 스토어가\n카탈로그에 없음?}
    L -- Yes --> M[updatePrice\n스마트스토어 API\n가격 업데이트]
    M --> F

    L -- No --> N{targetPrice 변경\nor 배송비 타입 변경?}
    N -- No --> F
    N -- Yes --> O[updatePrice\n스마트스토어 API\n가격 업데이트]
    O --> F

    F -- 루프 종료 --> P[page.close\n브라우저 종료]
    P --> Q[delayMinutes 5\n5분 대기]
    Q --> A
```

## 사용 기술

| 역할 | 기술 |
|---|---|
| 제품 카탈로그 관리 | Google Sheets API |
| 가격 크롤링 | Puppeteer |
| 가격 업데이트 | 네이버 커머스 API |
| 환경변수 관리 | dotenv |

## 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성하세요.

```env
# 구글 시트
SHEET_ID=
SHEET_NAME=

# 네이버 커머스 API
CLIENT_ID=
CLIENT_SECRET=

# 네이버 로그인
NAVER_ID=
NAVER_PASSWORD=

# 스마트 스토어 이름
SMART_STORE_NAME=
```

## 구글 시트 컬럼 구조

| 컬럼 | 인덱스 | 설명 |
|---|---|---|
| A | 0 | 제품명 |
| B | 1 | 카탈로그 URL |
| C | 2 | 활성화 여부 (TRUE / FALSE) |
| G | 6 | 배송비 타입 (무료 / 유료 / 수량별) |
| H | 7 | 무료배송 기준 금액 |
| I | 8 | 최저 판매가 |
| J | 9 | 기본 배송비 |
| K | 10 | 가상 판매처 가격 |
| L | 11 | 제외 판매처 (쉼표 구분) |

## 실행

```bash
node app.js
```
