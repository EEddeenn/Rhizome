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

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`my-4 border-l-4 ${style.border} ${style.bg} p-4 rounded-r`}>
      <button
        type="button"
        className="flex items-start gap-2 cursor-pointer select-none w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 -m-1 p-1 rounded"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
      >
        <span className="text-lg" aria-hidden="true">
          {isExpanded ? "▼" : "▶"}
        </span>
        <div className="flex-1">
          {title && <div className="font-semibold mb-1">{title}</div>}
        </div>
      </button>
      {isExpanded && (
        <div className="text-sm mt-2 ml-6">{children}</div>
      )}
    </div>
  );
});
