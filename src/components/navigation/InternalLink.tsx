"use client";

import { memo, useCallback } from "react";
import { useSplitView } from "@/components/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";
import { scrollElementIntoContainer } from "./scroll-utils";

interface InternalLinkProps {
  href?: string;
  children?: React.ReactNode;
}

function InternalLinkInner({ href, children }: InternalLinkProps) {
  const { openPane, isMobile, panes } = useSplitView();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isMobile || !href) return;

    const { isInternalNote } = classifyLink(href);
    if (!isInternalNote) return;

    const { slug, searchParams, anchor } = parseSlugFromHref(href);

    const paneEl = (e.target as HTMLElement).closest("[data-pane-index]");
    const paneIndex = paneEl ? parseInt(paneEl.getAttribute("data-pane-index") || "0", 10) : -1;
    const paneContainer = paneEl?.querySelector("[data-pane-content]");

    const isAnchorOnly = !href.startsWith("/") && href.startsWith("#");
    
    if (isAnchorOnly && anchor) {
      e.preventDefault();
      if (paneContainer) {
        const element = paneContainer.querySelector(`#${CSS.escape(anchor)}`);
        if (element) {
          scrollElementIntoContainer(paneContainer, element);
        }
      }
      return;
    }

    const currentPaneSlug = paneIndex >= 0 && paneIndex < panes.length ? panes[paneIndex]?.slug : null;
    const isSamePane = currentPaneSlug === slug;

    if (isSamePane && anchor) {
      e.preventDefault();
      if (paneContainer) {
        const element = paneContainer.querySelector(`#${CSS.escape(anchor)}`);
        if (element) {
          scrollElementIntoContainer(paneContainer, element);
        }
      }
      return;
    }

    e.preventDefault();
    openPane(slug, searchParams, false, anchor);
  }, [href, isMobile, openPane, panes]);

  if (!href) {
    return <span>{children}</span>;
  }

  const { isExternal, isInternalNote } = classifyLink(href);

  if (isExternal) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  }

  if (isMobile || !isInternalNote) {
    return <a href={href}>{children}</a>;
  }

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}

export const InternalLink = memo(InternalLinkInner);
