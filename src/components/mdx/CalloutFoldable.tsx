"use client";

import { useState, memo } from "react";
import { styles, type CalloutType } from "./CalloutBase";

type FoldState = "open" | "closed";

interface CalloutFoldableProps {
  type?: CalloutType;
  title?: string;
  fold?: FoldState;
  children: React.ReactNode;
}

export const CalloutFoldable = memo(function CalloutFoldable({ 
  type = "note", 
  title, 
  fold, 
  children 
}: CalloutFoldableProps) {
  const style = styles[type];
  const [isExpanded, setIsExpanded] = useState(fold !== "closed");

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`my-4 border-l-4 ${style.border} ${style.bg} p-4 rounded-r`}>
      <div
        className="flex items-start gap-2 cursor-pointer select-none"
        onClick={handleClick}
        role="button"
        aria-expanded={isExpanded}
      >
        <span className="text-lg">
          {isExpanded ? "▼" : "▶"}
        </span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {isExpanded && <div className="text-sm">{children}</div>}
        </div>
      </div>
    </div>
  );
});
