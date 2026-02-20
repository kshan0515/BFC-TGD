import { Serwist } from "@serwist/sw";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [], // 기본 캐싱 설정으로 단순화하여 빌드 오류 방지
});

serwist.addEventListeners();
