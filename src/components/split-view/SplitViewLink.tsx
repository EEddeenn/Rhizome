"use client";

import { useSplitView } from "@/lib/context/SplitViewContext";

interface SplitViewLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SplitViewLink({ href, children, className }: SplitViewLinkProps) {
  const { openPane, isMobile } = useSplitView();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const slug = href.replace(/^\//, "");
    openPane(slug);
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
