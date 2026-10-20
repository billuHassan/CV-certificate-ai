import { registerSW } from "virtual:pwa-register";

export function initPWA() {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log("[PWA] New content available; will update automatically.");
        updateSW(true);
      },
      onOfflineReady() {
        console.log("[PWA] App is ready to work offline. UI assets and editor precached.");
      },
      onRegisterError(error: any) {
        console.warn("[PWA] Service Worker registration failed:", error);
      },
    });
  }
}
