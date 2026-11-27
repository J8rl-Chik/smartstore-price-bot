import js from '@eslint/js';
import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tseslint from '@electron-toolkit/eslint-config-ts';
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginSecurity from 'eslint-plugin-security';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },

  pluginSecurity.configs.recommended,

  // 1. 검사 제외 대상 (무시할 폴더들)
  // 외부 라이브러리(node_modules)나 빌드 결과물(dist, out) 폴더는 소스 코드가 아니므로 감시하지 않습니다.
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/out',
      '**/rateLimitTest',
      '**/coverage',
      '**/config',
      '**/benchmark',
    ],
  },

  // 2. TypeScript 권장 규칙 적용
  // Electron 툴킷에서 제공하는 타입스크립트용 기본 표준 규칙들을 가져와 적용합니다.
  tseslint.configs.recommended,

  // 3. React 기본 권장 규칙 적용
  // 리액트 컴포넌트를 올바르게 작성했는지 검사하는 가장 대중적인 규칙들을 켭니다.
  eslintPluginReact.configs.flat.recommended,

  // 4. React 새 런타임 규칙 적용
  // React 17 버전부터는 파일 상단에 'import React from "react"'를 생략해도 되는데,
  // 이를 에러로 잡지 않고 정상으로 인식하게 해주는 설정입니다.
  eslintPluginReact.configs.flat['jsx-runtime'],

  // 5. React 버전 자동 감지
  {
    settings: {
      react: {
        // 내 프로젝트에 설치된 리액트 버전을 알아서 감지해서 그 버전에 맞는 규칙을 적용하라는 뜻입니다.
        version: 'detect',
      },
    },
  },

  // 6. TypeScript 및 React 전용 세부 플러그인과 규칙(Rules) 설정
  {
    // 대상 지정: .ts 나 .tsx 확장자를 가진 파일들에게 아래 규칙들을 적용합니다.
    files: ['**/*.{ts,tsx}'],

    // 사용할 추가 플러그인들 등록
    plugins: {
      'react-hooks': eslintPluginReactHooks, // 리액트 훅(useState, useEffect 등)의 사용 규칙을 검사
      'react-refresh': eslintPluginReactRefresh, // 맨 처음 배운 '핫 리로딩(HMR)'이 정상 동작하도록 코드를 감시
    },

    // 상세 규칙 커스텀 (구체적으로 어떻게 잡을 것인가)
    rules: {
      // 리액트 훅의 규칙(예: 루프나 조건문 안에서 훅을 쓰면 안 됨)을 엄격하게 적용합니다.
      ...eslintPluginReactHooks.configs.recommended.rules,
      // Vite 환경에서 리액트 컴포넌트가 정상적으로 핫 리로딩되도록 보장하는 규칙을 적용합니다.
      ...eslintPluginReactRefresh.configs.vite.rules,
      // HTML 문자열을 이스케이프 없이 넣는 dangerouslySetInnerHTML을 막는다. 꼭 필요하면 그 줄에서만 끈다.
      'react/no-danger': 'error',
      // href 등에 javascript: URL을 넣어 스크립트를 실행하지 못하게 막는다.
      'react/jsx-no-script-url': 'error',
    },
  },

  // 6-1. 테스트 파일은 반환 타입 명시 규칙 제외
  // 테스트 콜백(it/test 등)까지 매번 반환 타입을 적으면 번거로우므로 .test.ts(x) 파일만 예외로 끈다.
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },

  // 7. Prettier와의 충돌 방지 설정 (★마지막에 두는 것이 중요!)
  // 코드 감시관(ESLint)과 코드 정렬원(Prettier)이 서로 싸우지 않도록 만듭니다.
  // Prettier가 정렬해 줄 띄어쓰기나 괄호 관련 문법 규칙들은 ESLint가 간섭하지 않고 눈감아주게 만듭니다.
  eslintConfigPrettier,

  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
      /**
       * Airbnb 6.1: 문자열은 작은따옴표로 쓴다. 보간이 없는 템플릿 리터럴도 작은따옴표로 바꾼다.
       * Prettier는 백틱을 바꾸지 않아서 ESLint로 검사한다. 작은따옴표가 든 문자열은 큰따옴표를 허용한다.
       * eslint-config-prettier가 끄는 규칙이라 그 뒤인 여기에서 켠다.
       */
      quotes: ['error', 'single', { avoidEscape: true }],
      // Airbnb 7.1: 함수 선언 대신 함수 표현식(화살표 함수 포함)을 쓴다. 선언은 호이스팅돼 정의 전에 호출할 수 있기 때문이다.
      'func-style': ['error', 'expression'],
      /**
       * Airbnb 8.1: 익명 콜백은 화살표 함수로 쓴다. 옵션은 eslint-config-airbnb-base와 같다.
       * eslint-config-prettier가 prettier/prettier와 함께 쓰면 --fix가 충돌할 수 있다고 끄는 규칙이라 그 뒤인 여기에서 켠다.
       */
      'prefer-arrow-callback': ['error', { allowNamedFunctions: false, allowUnboundThis: true }],
      /**
       * Airbnb 8.2: 값을 반환하기만 하는 화살표 함수는 중괄호와 return을 생략한다. 옵션은 eslint-config-airbnb-base와 같다.
       * eslint-config-prettier가 prettier/prettier와 함께 쓰면 --fix가 충돌할 수 있다고 끄는 규칙이라 그 뒤인 여기에서 켠다.
       */
      'arrow-body-style': ['error', 'as-needed', { requireReturnForObjectLiteral: false }],
    },
  },
]);
