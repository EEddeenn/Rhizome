"use client";

import { useEffect } from "react";
import { useSplitView } from "@/lib/context/SplitViewContext";

export function LinkInterceptor() {
  const { openPane, isMobile } = useSplitView();

  useEffect(() => {
    if (isMobile) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      const isExternal = href.startsWith("http") || href.startsWith("//") || href.startsWith("#");
      if (isExternal) return;

      const isInternalNote = href.startsWith("/notes/") || href.startsWith("/articles/");

      if (isInternalNote) {
        e.preventDefault();
        const url = new URL(href, window.location.origin);
        const slug = url.pathname.replace(/^\//, "");
        const searchParams: Record<string, string> = {};
        url.searchParams.forEach((v, k) => {
          searchParams[k] = v;
        });
        openPane(slug, Object.keys(searchParams).length > 0 ? searchParams : undefined);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [openPane, isMobile]);

  return null;
}
