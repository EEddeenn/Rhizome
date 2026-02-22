"use client";

import type { ReactNode } from "react";
import { TitleIcon, DateIcon, TagIcon, StatusIcon, SummaryIcon } from "@/components/icons";

function formatFrontmatterValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") return value;
  return String(value);
}

interface FrontmatterDisplayProps {
  data: Record<string, unknown>;
}

export function FrontmatterDisplay({ data }: FrontmatterDisplayProps) {
  const fields: Array<{ key: string; label: string; icon: ReactNode }> = [
    { key: "title", label: "Title", icon: <TitleIcon /> },
    { key: "date", label: "Date", icon: <DateIcon /> },
    { key: "type", label: "Type", icon: <TagIcon /> },
    { key: "tags", label: "Tags", icon: <TagIcon /> },
    { key: "status", label: "Status", icon: <StatusIcon /> },
    { key: "summary", label: "Summary", icon: <SummaryIcon /> },
  ];

  const displayFields = fields.filter(f => data[f.key] !== undefined);

  if (displayFields.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-border">
      <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">
        Frontmatter
      </div>
      <div className="space-y-2">
        {displayFields.map(({ key, label, icon }) => (
          <div key={key} className="flex items-start gap-2">
            <span className="text-muted mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted">{label}:</span>
              <span className="ml-2 text-sm break-words">
                {formatFrontmatterValue(data[key])}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
