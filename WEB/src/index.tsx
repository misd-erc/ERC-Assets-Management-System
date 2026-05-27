import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import './index.css';

// ─── ResizeObserver loop fix ──────────────────────────────────────────────────
// Radix UI Popover/Command components measure themselves inside scrollable
// containers, which causes the browser to emit a "ResizeObserver loop completed
// with undelivered notifications" warning. The warning is harmless but CRA's dev
// overlay intercepts it via the webpack runtime (bypassing window.onerror).
//
// The proper fix is to prevent the loop from occurring at all by deferring every
// ResizeObserver callback to the next animation frame. This is the industry-
// standard approach used by libraries like @radix-ui/react-* and react-virtualized.
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class PatchedResizeObserver extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries: ResizeObserverEntry[], observer: ResizeObserver) => {
        // Defer to the next paint so the browser never sees a "loop"
        window.requestAnimationFrame(() => {
          if (entries.length) {
            callback(entries, observer);
          }
        });
      });
    }
  };
}
// ─────────────────────────────────────────────────────────────────────────────

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export {};

