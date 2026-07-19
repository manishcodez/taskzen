"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const POST_LOGOUT_KEY = "taskzen_post_logout";

export function markPostLogoutNavigation() {
  sessionStorage.setItem(POST_LOGOUT_KEY, "1");
}

function seedHomeBeforeAuthPage(pathname: string) {
  window.history.replaceState({ taskzenPage: "home" }, "", "/");
  window.history.pushState({ taskzenPage: pathname.replace("/", "") || "login" }, "", pathname);
}

export function PreparePublicBackNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register") {
      return;
    }

    const postLogout =
      sessionStorage.getItem(POST_LOGOUT_KEY) === "1" || searchParams.get("from") === "logout";

    if (postLogout) {
      sessionStorage.removeItem(POST_LOGOUT_KEY);
      seedHomeBeforeAuthPage(pathname);

      if (searchParams.get("from") === "logout") {
        router.replace(pathname, { scroll: false });
      }

      return;
    }

    if (window.history.length <= 1) {
      seedHomeBeforeAuthPage(pathname);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    function handlePopState() {
      const nextPath = `${window.location.pathname}${window.location.search}`;

      if (nextPath === "/" || nextPath.startsWith("/?")) {
        router.replace("/");
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [router]);

  return null;
}
