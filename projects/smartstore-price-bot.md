# 홍길동

> 프론트엔드 개발자 · hong@example.com · 010-0000-0000 · [GitHub](https://github.com/J8rl-Chik)

# 프로젝트

## 스마트스토어 최저가 자동 수정 프로그램 개선

1인 개발 · 2026년 7월 ~ 현재 · [저장소](https://github.com/J8rl-Chik/smartstore-price-bot)

네이버 스마트스토어 판매가를 경쟁 판매처보다 낮게 자동으로 유지하는 프로그램입니다. 3년 넘게 실제 운영에 써 온 CLI 프로그램을 TypeScript, 테스트, Electron GUI로 개선하고 있습니다.

- **도구** — TypeScript, Electron(electron-vite), React, styled-components, Puppeteer, Vitest, GitHub Actions, Snyk
- **외부 API** — 스마트스토어 Commerce API, Google Sheets API

> 자세한 과정과 측정 표는 [README](https://github.com/J8rl-Chik/smartstore-price-bot/blob/feat/implement-electron-gui/README.md)에 있습니다.

### 기존 프로젝트

- 제품마다 최저가를 확인하고 직접 수정하던 작업을 Puppeteer와 Commerce API로 자동화
- 1개당 수정 시간 **약 40초 → 약 15초**, 3년 넘게 실제 운영

### 개선 프로젝트

#### AI 활용

- Claude Code로 보안 점검, 테스트 작성, PR 리뷰, 기능 구현, 형상 관리 등을 진행하고 결과는 직접 검토
- 반복되는 실수는 `CLAUDE.md`와 Skills 5개에 등록해 조치
- 주로 사용한 프롬프트
  - "공식 문서에서 근거를 찾아 설명해줘"
  - "구현 방법별 장단점을 비교해줘"
  - "비전공자도 이해할 수 있게 예시 시나리오로 설명해줘"
- 모르는 내용은 공식 문서를 Gemini Notebook으로 학습한 뒤 적용

#### 보안 점검

- 보안 서적 학습 내용으로 9개 영역(XSS, CSRF, Electron 보안 체크리스트 등)의 점검 목록을 만들어 Claude Code로 탐색
- **21건 조치** (Electron 보안 체크리스트 7건, GitHub·Actions 7건 등), 우선순위가 낮은 5건은 이슈로 분리
- Node.js 취약점(CVE)은 우회 코드를 넣기 전에 외부 API 응답을 10회씩 측정해, 영향이 없음을 확인하고 업데이트로 대응
- npm audit, Dependabot으로 찾은 의존성 취약점 **41건 중 39건**을 미사용 의존성 삭제·업데이트로 조치

#### 사용자 경험

- 매번 CLI로 실행하던 프로그램을 Electron GUI로 전환해 실행 단계를 **3단계 → 2단계**로 줄임
- 상품 간 대기(10초)·순회 간격(5분) 등을 설정 화면에서 바꿀 수 있게 해, **코드 수정 없이** 조정
- 준비(약 10초)·진행 중 앱이 작업 중인지 알 수 없어 **스켈레톤 UI**를 추가
- **에러 메시지 17개**를 한곳에 모아 사용자가 이해하기 쉬운 말로 고치고, 에러가 날 경우 멈추지 않고 이유를 화면에서 확인
- **자동 업데이트**로 바꿔, 실행 시 업데이트 다운로드 완료 알림 후 앱을 종료하면 새 버전 설치
- 불규칙적인 재부팅으로 프로그램이 최대 3시간 멈추던 문제를 재부팅 후 사용자 입력 시간(기본 5분) 뒤 **자동 시작**으로 변경

#### 개발

- 안정성을 고려해 TypeScript로 마이그레이션, Vitest로 **테스트 641개** 작성
- 제품 순회 코드를 React 훅에서 main 프로세스로 옮겨, 훅 코드 **약 120줄 → 60줄**, 훅 테스트 코드 **약 470줄 → 160줄**
- GitHub Actions **워크플로 7개**로 린트·테스트·보안 검사·AI 코드 리뷰·배포 등 자동화

#### 성능 최적화

- CI 과정에서 Playwright 설치 옵션(`--with-deps`)을 제거해 설치 시간 **17초 → 9초**로 단축
- PR마다 진행했던 CI 과정 중 의존성 설치를 `node_modules` 캐싱해 해당 워크플로 시간 **133.5초 → 73초**로 단축
- 소스맵으로 확인 후 번들의 94%를 차지하던 googleapis를 Sheets 전용 패키지로 교체해, main 빌드 **29.6초 → 2.8초**로 단축
- googleapis 교체와 jsdom 파싱을 페이지 내부 추출로 대체해 창 뜨는 시간 **1,359ms → 790ms(-42%)**, 코드 **65.7MiB → 27.3MiB**로 감소
- `useMemo`·`memo`를 사용해 순회 1회당 제품 목록 행 렌더링 횟수를 **(2N+1) × N → 3N**으로 감소
