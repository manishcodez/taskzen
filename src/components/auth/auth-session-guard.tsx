"use client";

import { useEffect } from "react";

async function verifySession() {
  try {
    const response = await fetch("/api/auth/me", {
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      window.location.replace("/login");
    }
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
