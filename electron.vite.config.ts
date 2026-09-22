import { defineConfig } from 'electron-vite';
import react from '@vitejs/plugin-react';

// electron-vite의 전체 빌드 및 개발 설정을 통합하여 선언합니다.
export default defineConfig({
  // 1. 메인 프로세스(Main Process) 설정
  // src/main 폴더 안의 코드를 빌드할 때 적용되는 규칙입니다.
  // 현재는 중괄호가 비어있으므로({}) electron-vite가 제공하는 기본 최적화 설정을 그대로 따릅니다.
  main: {},

  // 2. 프리로드 프로세스(Preload Process) 설정
  // src/preload 폴더 안의 코드를 빌드할 때 적용되는 규칙입니다.
  // 마찬가지로 비어있으므로 기본 설정(보안 및 메인-렌더러 다리 역할 최적화)을 적용합니다.
  preload: {},

  // 3. 렌더러 프로세스(Renderer Process) 설정
  // 사용자의 눈에 보이는 웹 화면(src/renderer)을 빌드하고 실행할 때 적용되는 규칙입니다.
  renderer: {
    resolve: {
      // 별칭(Alias) 설정: 코드 안에서 긴 상대 경로(예: ../../../components/Button)를
      // 깔끔하고 단순하게 줄여서 쓸 수 있도록 이정표를 세워줍니다.
      alias: {
        // 앞으로 코드에서 '@renderer'라고 적으면, 자동으로 'src/renderer/src' 폴더를 가리키게 됩니다.
        // '@renderer': resolve('src/renderer/src')
      },
    },
    // 플러그인 설정: 이 프로젝트의 화면을 'React(리액트)'로 그리겠다는 선언입니다.
    // 이 플러그인 덕분에 리액트 컴포넌트(.jsx, .tsx)와 핫 리로딩(HMR)이 완벽하게 지원됩니다.
    plugins: [react()],
  },
});
