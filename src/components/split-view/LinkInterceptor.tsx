"use client";

import { useEffect } from "react";
import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

function scrollInContainer(container: Element, element: Element) {
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - 20;
  container.scrollTo({ top: scrollTop, behavior: "smooth" });
}

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

      const paneEl = anchor.closest("[data-pane-index]");
      const paneIndex = paneEl ? parseInt(paneEl.getAttribute("data-pane-index") || "0", 10) : -1;
      const paneContainer = paneEl?.querySelector("[data-pane-content]");

      if (isAnchorOnly && urlAnchor) {
        e.preventDefault();
        if (paneContainer) {
          const element = paneContainer.querySelector(`#${CSS.escape(urlAnchor)}`);
          if (element) {
            scrollInContainer(paneContainer, element);
          }
        }
        return;
      }

      if (isInternalNote) {
        const currentPaneSlug = paneIndex >= 0 && paneIndex < panes.length ? panes[paneIndex]?.slug : null;
        const isSamePane = currentPaneSlug === slug;

        if (isSamePane && urlAnchor) {
          e.preventDefault();
          if (paneContainer) {
            const element = paneContainer.querySelector(`#${CSS.escape(urlAnchor)}`);
            if (element) {
              scrollInContainer(paneContainer, element);
            }
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
