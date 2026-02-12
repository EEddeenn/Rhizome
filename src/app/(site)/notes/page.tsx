import { getNotes } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { EntryList } from "@/components/blocks/EntryList";

export const metadata = {
  title: "Notes",
  description: "All notes in the knowledge base",
};

export default function NotesPage() {
  const notes = sortEntries(getNotes());

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Notes</h1>
      <EntryList entries={notes} />
    </main>
  );
}
