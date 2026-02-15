"use client";

import { useSplitView } from "@/components/context/SplitViewContext";

interface SplitViewLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SplitViewLink({ href, children, className }: SplitViewLinkProps) {
  const { openPane, isMobile } = useSplitView();

  const handleClick = (e: React.MouseEvent) => {
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
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
