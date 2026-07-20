"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const DISMISS_KEY = "taskzen_pwa_install_dismissed";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const until = Number(raw);
    if (!Number.isFinite(until)) return false;
    return Date.now() < until;
  } catch {
    return false;
  }
}

function setDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS));
  } catch {
    // ignore
  }
}

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)").matches;
  const iosStandalone =
    "standalone" in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return mq || iosStandalone;
}

/**
 * Minimal, dismissible install affordance. Only appears when the browser fires
 * beforeinstallprompt and the user has not recently dismissed it.
 */
export function PwaInstallHint() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay() || isDismissed()) {
      return;
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !deferred) {
    return null;
  }

  async function onInstall() {
    if (!deferred) return;
    setVisible(false);
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // ignore
    }
    setDeferred(null);
  }

  function onDismiss() {
    setDismissed();
    setVisible(false);
    setDeferred(null);
  }

  return (
    <div
      role="dialog"
      aria-label="Install Taskzen"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pointer-events-none"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border/70 bg-card/95 px-4 py-3 shadow-card backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Install Taskzen</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Add the app to your device for quicker access.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onDismiss}>
            Not now
          </Button>
          <Button type="button" size="sm" onClick={onInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
