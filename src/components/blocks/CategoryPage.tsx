import { EntryList } from "@/components/blocks/EntryList";
import type { Entry } from "@/lib/content/types";

interface CategoryPageProps {
  title: string;
  entries: Entry[];
}

export function CategoryPage({ title, entries }: CategoryPageProps) {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{title}</h1>
      <EntryList entries={entries} />
    </main>
  );
}
