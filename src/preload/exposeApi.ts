// renderer(웹 페이지)가 안전하게 접근할 수 있는 API를 window 객체에 노출한다.
import { contextBridge, ipcRenderer } from 'electron';
// electron-toolkit이 제공하는 공통 헬퍼(ipcRenderer 래퍼 등)
import { electronAPI } from '@electron-toolkit/preload';
import type { IpcEvent } from './_type';

// 이 프로젝트에서 renderer에 직접 노출할 커스텀 API.
const api: IpcEvent = {
  // renderer -> main으로 'createLoginPage' 요청을 보내 Puppeteer 브라우저 페이지 생성 및 네이버 로그인을 트리거한다.
  createLoginPage: () => ipcRenderer.invoke('createLoginPage'),
  // renderer -> main으로 'getTargetProducts' 요청을 보내 네이버 판매 상품과 구글 시트 행을 합친 가격 수정 대상 목록을 가져온다.
  getTargetProducts: () => ipcRenderer.invoke('getTargetProducts'),
  // renderer -> main으로 'getSellers' 요청을 보내 상품의 카탈로그 페이지에서 네이버 판매처 목록을 가져온다.
  getSellers: (catalogURL, productName) =>
    ipcRenderer.invoke('getSellers', catalogURL, productName),
  // renderer -> main으로 'filterSellers' 요청을 보내 판매처 목록에서 내 스토어와 제외 판매처를 뺀 최종 비교 대상 판매처 목록을 가져온다.
  filterSellers: (sellers, excludedSellerNames) =>
    ipcRenderer.invoke('filterSellers', sellers, excludedSellerNames),
  // renderer -> main으로 'getTargetPrice' 요청을 보내 비교 대상 가격 목록과 무료배송 기준가로 계산한 목표 가격을 가져온다.
  getTargetPrice: (prices, freeDeliveryPrice) =>
    ipcRenderer.invoke('getTargetPrice', prices, freeDeliveryPrice),
  // renderer -> main으로 'updatePrice' 요청을 보내 상품의 판매가와 배송비를 목표 가격과 배송비 설정에 맞춰 수정한다.
  updatePrice: (originProductNo, targetPrice, delivery) =>
    ipcRenderer.invoke('updatePrice', originProductNo, targetPrice, delivery),
};

/**
 * contextIsolation이 켜져 있으면(Electron 기본값, 보안 권장 설정)
 * renderer가 Node.js/Electron 객체에 직접 접근할 수 없으므로,
 * contextBridge를 통해서만 안전하게 API를 주입할 수 있다.
 * 꺼져 있는 경우(레거시 설정)에는 window 전역에 바로 할당해도 된다.
 */
export const exposeApi = (): void => {
  if (process.contextIsolated) {
    try {
      // renderer에서 window.electron 으로 electron-toolkit 헬퍼 사용 가능
      contextBridge.exposeInMainWorld('electron', electronAPI);
      // renderer에서 window.api 로 커스텀 API 사용 가능
      contextBridge.exposeInMainWorld('api', api);
    } catch (error) {
      console.error(error);
    }
  } else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
  }
};
