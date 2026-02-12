interface EntryMetadataProps {
  date?: string;
  updated?: string;
  status?: string;
  readingTimeMin?: number;
  wordCount?: number;
}

const statusStyles: Record<string, { label: string; className: string }> = {
  "to-read": { label: "To Read", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  "reading": { label: "Reading", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  "done": { label: "Done", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
};

export function EntryMetadata({ date, updated, status, readingTimeMin, wordCount }: EntryMetadataProps) {
  const hasMetadata = date || updated || status || readingTimeMin || wordCount;
  if (!hasMetadata) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted">
      {date && (
        <span>{date}</span>
      )}
      {updated && updated !== date && (
        <span>(updated: {updated})</span>
      )}
      {readingTimeMin && (
        <span>· {readingTimeMin} min read</span>
      )}
      {wordCount && (
        <span>· {wordCount} words</span>
      )}
      {status && statusStyles[status] && (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyles[status].className}`}>
          {statusStyles[status].label}
        </span>
      )}
    </div>
  );
}
