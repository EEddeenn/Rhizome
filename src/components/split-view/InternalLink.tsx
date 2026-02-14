"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

interface InternalLinkProps {
  href?: string;
  children?: React.ReactNode;
}

function scrollInContainer(container: Element | null, element: Element) {
  if (!container) return;
  const elementRect = element.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();
  const scrollTop = container.scrollTop + (elementRect.top - containerRect.top) - 20;
  container.scrollTo({ top: scrollTop, behavior: "smooth" });
}

export function InternalLink({ href, children }: InternalLinkProps) {
  const { openPane, isMobile, panes } = useSplitView();

  if (!href) {
    return <span>{children}</span>;
  }

  const { isExternal, isInternalNote } = classifyLink(href);
  const { slug, searchParams, anchor } = parseSlugFromHref(href);

  if (isExternal) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isMobile) return;

    if (!isInternalNote) return;

    const paneEl = (e.target as HTMLElement).closest("[data-pane-index]");
    const paneIndex = paneEl ? parseInt(paneEl.getAttribute("data-pane-index") || "0", 10) : -1;
    const paneContainer = paneEl?.querySelector("[data-pane-content]");

    const isAnchorOnly = !href.startsWith("/") && href.startsWith("#");
    
    if (isAnchorOnly && anchor) {
      e.preventDefault();
      if (paneContainer) {
        const element = paneContainer.querySelector(`#${CSS.escape(anchor)}`);
        if (element) {
          scrollInContainer(paneContainer, element);
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
          scrollInContainer(paneContainer, element);
        }
      }
      return;
    }

    e.preventDefault();
    openPane(slug, searchParams, false, anchor);
  };

  if (isMobile) {
    return <a href={href}>{children}</a>;
  }

  if (!isInternalNote) {
    return <a href={href}>{children}</a>;
  }

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
