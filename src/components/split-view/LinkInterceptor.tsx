"use client";

import { useEffect } from "react";
import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

export function LinkInterceptor() {
  const { openPane, isMobile, panes } = useSplitView();

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

      const isAnchorOnly = !href.startsWith("/") && href.startsWith("#");
      const { slug, searchParams, anchor: urlAnchor } = parseSlugFromHref(href);

      if (isAnchorOnly && urlAnchor) {
        e.preventDefault();
        const element = document.getElementById(urlAnchor);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      if (isInternalNote) {
        const currentPaneSlug = panes.length > 0 ? panes[panes.length - 1]?.slug : null;
        const isSamePane = currentPaneSlug === slug;

        if (isSamePane && urlAnchor) {
          e.preventDefault();
          const element = document.getElementById(urlAnchor);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }

        e.preventDefault();
        openPane(slug, searchParams, false, urlAnchor);
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [openPane, isMobile, panes]);

  return null;
}
