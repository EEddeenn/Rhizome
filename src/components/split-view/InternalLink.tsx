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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const slug = href.replace(/^\//, "");
    openPane(slug);
  };

  if (isMobile) {
    return <a href={href}>{children}</a>;
  }

  return (
    <a href={href} onClick={handleClick}>
      {children}
    </a>
  );
}
