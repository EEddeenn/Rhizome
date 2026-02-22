import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

export interface ManifestEntryForCompletion {
  title: string;
  slug: string;
  type: string;
}

export function createWikiLinkCompleter(
  getEntries: () => ManifestEntryForCompletion[]
): (context: CompletionContext) => CompletionResult | null {
  return (context: CompletionContext) => {
    const before = context.matchBefore(/\[\[[^\]|]*$/);
    if (!before || (context.explicit && !before)) return null;

    const query = before.text.slice(2).toLowerCase();
    const entries = getEntries()
      .filter((e) => e.type !== "pdf" && 
        (e.title.toLowerCase().includes(query) || e.slug.toLowerCase().includes(query)))
      .slice(0, 20);

    return {
      from: before.from + 2,
      options: entries.map((e) => ({
        label: e.title,
        displayLabel: e.title,
        detail: e.slug,
        apply: e.title,
      })),
      validFor: /^.*$/,
    };
  };
}
