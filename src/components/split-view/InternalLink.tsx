"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";

interface InternalLinkProps {
  href?: string;
  children?: React.ReactNode;
}

export function InternalLink({ href, children }: InternalLinkProps) {
  const { openPane, isMobile } = useSplitView();

  if (!href) {
    return <span>{children}</span>;
  }

  const isExternal = href.startsWith("http") || href.startsWith("//") || href.startsWith("#");

  if (isExternal) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  }

  const isInternalNote = href.startsWith("/notes/") || href.startsWith("/articles/");

  const handleClick = (e: React.MouseEvent) => {
    if (!isInternalNote) return;
    
    e.preventDefault();
    const url = new URL(href, window.location.origin);
    const slug = url.pathname.replace(/^\//, "");
    const searchParams: Record<string, string> = {};
    url.searchParams.forEach((v, k) => {
      searchParams[k] = v;
    });
    openPane(slug, Object.keys(searchParams).length > 0 ? searchParams : undefined);
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
