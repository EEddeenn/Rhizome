interface EmbedErrorProps {
  target: string;
  reason: "not_found" | "section_not_found" | "block_not_found" | "cycle_detected";
}

const reasonMessages: Record<EmbedErrorProps["reason"], string> = {
  not_found: "note not found",
  section_not_found: "section not found",
  block_not_found: "block ID not found",
  cycle_detected: "circular embed detected",
};

export function EmbedError({ target, reason }: EmbedErrorProps) {
  return (
    <div className="my-4 p-4 border-l-4 border-red-400 bg-red-50 dark:bg-red-950/30 rounded-r-lg">
      <div className="flex items-start gap-2">
        <span className="text-red-500 dark:text-red-400 font-medium">⚠ Embed Error</span>
      </div>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        Could not embed <code className="px-1 py-0.5 bg-red-100 dark:bg-red-900 rounded">{target}</code>: {reasonMessages[reason]}
      </p>
    </div>
  );
}
