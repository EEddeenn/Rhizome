"use client";

import { useEffect } from "react";
import { useSplitView } from "@/components/context/SplitViewContext";
import { useContentReadyOptional } from "@/components/context/ContentReadyContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";
import { scrollElementIntoContainer, scrollElementIntoView } from "./scroll-utils";

export function LinkInterceptor() {
  const { openPane, isMobile, panes } = useSplitView();
  const contentReadyCtx = useContentReadyOptional();

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
          const currentSlug = panes[paneIndex]?.slug;

          const doScroll = () => {
            const element = paneContainer.querySelector(`#${CSS.escape(urlAnchor)}`);
            if (element) {
              scrollElementIntoContainer(paneContainer, element);
            }
          };

          if (currentSlug && contentReadyCtx) {
            if (contentReadyCtx.isReady(currentSlug)) {
              doScroll();
            } else {
              contentReadyCtx.waitForReady(currentSlug, doScroll, 500);
            }
          } else {
            doScroll();
          }
        } else {
          const currentSlug = window.location.pathname.slice(1);
          const element = document.getElementById(urlAnchor);

          const doScroll = () => {
            if (element) {
              scrollElementIntoView(element);
            }
          };

          if (currentSlug && contentReadyCtx) {
            if (contentReadyCtx.isReady(currentSlug)) {
              doScroll();
            } else {
              contentReadyCtx.waitForReady(currentSlug, doScroll, 500);
            }
          } else {
            doScroll();
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
            const doScroll = () => {
              const element = paneContainer.querySelector(`#${CSS.escape(urlAnchor)}`);
              if (element) {
                scrollElementIntoContainer(paneContainer, element);
              }
            };

            if (currentPaneSlug && contentReadyCtx) {
              if (contentReadyCtx.isReady(currentPaneSlug)) {
                doScroll();
              } else {
                contentReadyCtx.waitForReady(currentPaneSlug, doScroll, 500);
              }
            } else {
              doScroll();
            }
          } else {
            const element = document.getElementById(urlAnchor);
            if (element) {
              scrollElementIntoView(element);
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
  }, [openPane, isMobile, panes, contentReadyCtx]);

  return null;
}
