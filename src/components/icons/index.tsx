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

export const EyeIcon = createIcon("M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z", { className: "w-5 h-5" });
export const EyeSlashIcon = createIcon("M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21", { className: "w-5 h-5" });
export const RefreshIcon = createIcon("M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", { className: "w-4 h-4" });
export const SettingsIcon = createIcon("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z", { className: "w-5 h-5" });
export const ExclamationIcon = createIcon("M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", { className: "w-5 h-5" });

export const TitleIcon = createIcon("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", { className: "w-4 h-4" });
export const DateIcon = createIcon("M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", { className: "w-4 h-4" });
export const TagIcon = createIcon("M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", { className: "w-4 h-4" });
export const StatusIcon = createIcon("M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", { className: "w-4 h-4" });
export const SummaryIcon = createIcon("M4 6h16M4 12h16M4 18h7", { className: "w-4 h-4" });

export const iconPaths = {
  close: "M6 18L18 6M6 6l12 12",
  menu: "M4 6h16M4 12h16M4 18h16",
} as const;
