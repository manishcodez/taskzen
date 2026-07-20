"use client";

import { useEffect } from "react";

async function refreshSession() {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
  });

  return response.ok;
}

async function verifySession() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });

    if (response.ok) {
      return;
    }

    if (response.status === 401) {
      const refreshed = await refreshSession();
      if (refreshed) {
        const retry = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });
        if (retry.ok) {
          return;
        }
      }
    }

    window.location.replace("/login");
  } catch {
    window.location.replace("/login");
  }
}

export function AuthSessionGuard() {
  useEffect(() => {
    void verifySession();

    function handlePageShow() {
      void verifySession();
    }

    function handlePopState() {
      void verifySession();
    }

    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
