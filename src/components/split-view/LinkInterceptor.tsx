"use client";

import { useEffect } from "react";
import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

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

      const { isExternal, isInternalNote } = classifyLink(href);
      if (isExternal) return;

      if (isInternalNote) {
        e.preventDefault();
        const { slug, searchParams } = parseSlugFromHref(href);
        openPane(slug, searchParams);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [openPane, isMobile]);

  return null;
}
