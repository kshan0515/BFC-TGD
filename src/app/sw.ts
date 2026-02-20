import { defaultCacheOnNavigation, Serwist } from "@serwist/sw";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCacheOnNavigation,
});

serwist.addEventListeners();
