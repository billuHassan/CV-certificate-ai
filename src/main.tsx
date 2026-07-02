import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully intercept and mute benign Vite HMR WebSocket connection closed errors
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || "");
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("HMR") ||
      msg.includes("connection")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("Muted benign Vite HMR WebSocket unhandled rejection:", msg);
    }
  });

  window.addEventListener("error", (event) => {
    const msg = event.message || "";
    if (
      msg.includes("WebSocket") ||
      msg.includes("websocket") ||
      msg.includes("HMR") ||
      msg.includes("connection")
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn("Muted benign Vite HMR WebSocket error:", msg);
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

