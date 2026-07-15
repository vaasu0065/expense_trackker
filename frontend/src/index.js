import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

// Global function for Hard Refreshing the PWA and clearing stale caches
window.hardRefreshPWA = async () => {
  console.log("Triggering Hard Refresh & Cache Clear for PWA...");
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        if (reg.active) {
          reg.active.postMessage({ type: "CLEAR_CACHE" });
        }
        await reg.unregister();
      }
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.error("Cache clear error:", err);
  } finally {
    // Force browser reload ignoring cache with timestamp parameter
    const url = new URL(window.location.href);
    url.searchParams.set("refresh", Date.now());
    window.location.href = url.toString();
  }
};

// Register service worker with Auto-Update detection for PWA support
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) => {
        console.log("SW registered:", reg.scope);

        // Check for updates periodically every 10 minutes
        setInterval(() => {
          reg.update();
        }, 10 * 60 * 1000);

        // Detect new Service Worker installing or waiting after commit
        reg.addEventListener("updatefound", () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;
          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
              console.log("New PWA deployment detected! Activating new version...");
              installingWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });
      })
      .catch((err) => console.log("SW registration failed:", err));

    // Reload browser page automatically when new service worker takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        console.log("New SW active. Reloading PWA to load latest commit changes...");
        window.location.reload();
      }
    });
  });
}
