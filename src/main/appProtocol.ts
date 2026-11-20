import { net, protocol } from 'electron';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * renderer 페이지를 file:// 대신 app://renderer/로 띄우기 위한 커스텀 프로토콜.
 * file://은 모든 로컬 파일이 같은 origin이라, 앱 페이지만 가진 origin을 만들어 다른 로컬 파일과 구분한다.
 */
const appScheme = 'app';
const appHost = 'renderer';

// 빌드한 renderer 파일이 있는 폴더. main 번들(out/main/index.cjs) 기준 위치다.
const rendererRoot = join(__dirname, '../renderer');

/**
 * 요청 주소를 renderer 폴더 안의 파일 경로로 바꾼다.
 * 다른 호스트, 해석할 수 없는 경로, 역슬래시가 든 경로, renderer 폴더 자체나 폴더 밖을 가리키는 경로(../ 등)는 null을 반환해 응답하지 않는다.
 */
const resolveRendererFilePath = (requestURL: string): string | null => {
  /**
   * 주소를 호스트와 경로로 나눈다. 경로의 %20 같은 인코딩은 그대로 남는다.
   * new URL('app://renderer/assets/my%20image.png') → host: 'renderer', pathname: '/assets/my%20image.png'
   */
  const { host, pathname } = new URL(requestURL);

  if (host !== appHost) {
    return null;
  }

  let decodedPathname: string;

  /**
   * 퍼센트 인코딩을 실제 문자로 바꾼다. 잘못된 인코딩이면 URIError를 던진다.
   * decodeURIComponent('/assets/my%20image.png') → '/assets/my image.png'
   * decodeURIComponent('/..%2Fsecret.txt') → '/../secret.txt'
   * decodeURIComponent('/%E0%A4%A') → URIError
   */
  try {
    decodedPathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }

  // 역슬래시는 Windows에서만 경로 구분자라, OS와 관계없이 같은 결과가 나오도록 먼저 거부한다. 빌드 파일 이름에는 쓰이지 않는다.
  if (decodedPathname.includes('\\')) {
    return null;
  }

  /**
   * renderer 폴더를 기준으로 경로를 이어 붙이고 ../를 계산한 절대 경로를 만든다. 앞에 .을 붙여 / 로 시작해도 폴더 기준으로 이어지게 한다.
   * rendererRoot가 'C:\app\out\renderer'일 때
   * resolve(rendererRoot, './assets/my image.png') → 'C:\app\out\renderer\assets\my image.png'
   * resolve(rendererRoot, './../secret.txt') → 'C:\app\out\secret.txt'
   */
  const filePath = resolve(rendererRoot, `.${decodedPathname}`);

  /**
   * renderer 폴더에서 filePath까지 가는 상대 경로를 구한다.
   * 'assets\my image.png' → 폴더 안, '..\secret.txt' → 폴더 밖, '' → 폴더 자체
   * 드라이브가 다르면 상대 경로를 만들 수 없어 'D:\x' 같은 절대 경로가 나온다. (isAbsolute → true)
   */
  const relativePath = relative(rendererRoot, filePath);

  // 빈 문자열은 renderer 폴더 자체를 요청한 것이라 파일이 아니므로 거부한다.
  if (relativePath === '' || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return null;
  }

  return filePath;
};

/**
 * app 스킴을 일반 웹 주소처럼 다루도록 등록한다. app.whenReady() 전에 한 번만 호출해야 한다.
 * standard: app://renderer/를 호스트가 있는 주소로 해석해 origin이 app://renderer가 된다. 상대 경로도 이 기준으로 풀린다.
 * secure: https처럼 안전한 출처로 취급한다.
 * supportFetchAPI: renderer가 fetch로 app:// 파일을 불러올 수 있게 한다.
 */
export const registerAppScheme = (): void => {
  protocol.registerSchemesAsPrivileged([
    { scheme: appScheme, privileges: { standard: true, secure: true, supportFetchAPI: true } },
  ]);
};

// app:// 요청에 renderer 폴더 안의 파일로 응답한다. app.whenReady() 뒤에 호출해야 한다.
export const registerAppProtocol = (): void => {
  protocol.handle(appScheme, (request) => {
    const filePath = resolveRendererFilePath(request.url);

    if (filePath === null) {
      return new Response(null, { status: 404 });
    }

    return net.fetch(pathToFileURL(filePath).href);
  });
};
