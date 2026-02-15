"use client";

import { useEffect, useRef } from "react";
import type { Entry, Manifest, BacklinkInfo } from "@/lib/content/types";

interface BacklinksDropdownProps {
  backlinks: BacklinkInfo[];
  manifest: Manifest;
  isOpen: boolean;
  onClose: () => void;
  onOpenPane: (slug: string) => void;
}

export function BacklinksDropdown({ backlinks, manifest, isOpen, onClose, onOpenPane }: BacklinksDropdownProps) {
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

  if (!isOpen || !backlinks || backlinks.length === 0) return null;

  const entries = backlinks
    .map((info) => manifest.find((e) => e.slug === info.slug))
    .filter((e): e is Entry => e !== undefined);

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 w-64 max-h-80 overflow-auto overscroll-contain bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
    >
      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Backlinks ({entries.length})
        </h3>
      </div>
      <ul className="py-1">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <button
              onClick={() => {
                onOpenPane(entry.slug);
                onClose();
              }}
              className="w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 block py-1.5 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase mr-1">
                {entry.type}
              </span>
              {entry.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
