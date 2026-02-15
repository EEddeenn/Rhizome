"use client";

import { useEffect, useRef } from "react";
import type { Heading } from "@/lib/content/types";
import { scrollElementIntoContainer } from "@/components/navigation";

interface TocDropdownProps {
  headings: Heading[];
  paneRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export function TocDropdown({ headings, paneRef, isOpen, onClose }: TocDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !headings || headings.length === 0) return null;

  const filteredHeadings = headings.filter((h) => h.depth >= 2 && h.depth <= 4);
  if (filteredHeadings.length === 0) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const pane = paneRef.current;
    if (!pane) return;
    
    const contentContainer = pane.querySelector("[data-pane-content]");
    const target = pane.querySelector(`#${CSS.escape(id)}`);
    if (target && contentContainer) {
      scrollElementIntoContainer(contentContainer, target);
    }
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-auto overscroll-contain bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Table of Contents
        </h3>
      </div>
      <ul className="py-1">
        {filteredHeadings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.depth - 2) * 12 + 8}px` }}
          >
            <a
              href={`#${heading.id}`}
              onClick={(e) => handleClick(e, heading.id)}
              className="text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 block py-1.5 px-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
