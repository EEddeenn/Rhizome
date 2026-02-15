import type { ReactNode } from "react";

interface IconProps {
  className?: string;
}

function createIcon(pathD: string, defaultProps?: { className?: string }) {
  return function Icon({ className }: IconProps): ReactNode {
    return (
      <svg
        aria-hidden="true"
        className={className ?? defaultProps?.className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={pathD} />
      </svg>
    );
  };
}

export const CloseIcon = createIcon("M6 18L18 6M6 6l12 12", { className: "w-4 h-4" });
export const MenuIcon = createIcon("M4 6h16M4 12h16M4 18h16", { className: "w-4 h-4" });

export const ChevronLeftIcon = createIcon("M15 19l-7-7 7-7", { className: "w-4 h-4" });
export const ChevronRightIcon = createIcon("M9 5l7 7-7 7", { className: "w-4 h-4" });
export const BacklinksIcon = createIcon("M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6", { className: "w-4 h-4" });

export const PlusIcon = createIcon("M12 4v16m8-8H4", { className: "w-4 h-4" });
export const MinusIcon = createIcon("M20 12H4", { className: "w-4 h-4" });
export const DuplicateIcon = createIcon("M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", { className: "w-4 h-4" });

export const TocIcon = createIcon("M4 6h16M4 10h16M4 14h16M4 18h16", { className: "w-4 h-4" });
export const OpenFullIcon = createIcon("M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14", { className: "w-4 h-4" });
export const FullscreenIcon = createIcon("M4 8V4h4M4 16v4h4M20 8V4h-4M20 16v4h-4", { className: "w-4 h-4" });

export const iconPaths = {
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
} as const;
