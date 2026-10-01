// preload 스크립트: main 프로세스와 renderer 프로세스 사이에서 실행되는 진입점.
// 로직은 exposeApi.ts에 두고, 여기서는 호출만 한다. (import만으로 실행되는 코드를 테스트하기 어렵기 때문)
import { exposeApi } from './exposeApi';

exposeApi();
