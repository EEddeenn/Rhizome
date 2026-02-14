"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";
import { classifyLink, parseSlugFromHref } from "@/lib/content/link-utils";

interface InternalLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function InternalLink({ href, children }: InternalLinkProps) {
  const { openPane, isMobile } = useSplitView();

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

  const handleClick = (e: React.MouseEvent) => {
    if (!isInternalNote) return;

    e.preventDefault();
    const { slug, searchParams } = parseSlugFromHref(href);
    openPane(slug, searchParams);
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
