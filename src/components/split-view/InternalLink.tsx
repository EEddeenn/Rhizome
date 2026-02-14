"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

interface InternalLinkProps {
  href?: string;
  children?: React.ReactNode;
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

    const isAnchorOnly = !href.startsWith("/") && href.startsWith("#");
    
    if (isAnchorOnly && anchor) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const currentPaneSlug = panes.length > 0 ? panes[panes.length - 1]?.slug : null;
    const isSamePane = currentPaneSlug === slug;

    if (isSamePane && anchor) {
      e.preventDefault();
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
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
