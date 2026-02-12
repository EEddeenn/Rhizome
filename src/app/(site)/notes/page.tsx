import { getNotes } from "@/lib/generated/load-manifest";
import { sortEntries } from "@/lib/content/sort";
import { CategoryPage } from "@/components/blocks/CategoryPage";

export const metadata = {
  title: "Notes",
  description: "All notes in the knowledge base",
};

export default function NotesPage() {
  const notes = sortEntries(getNotes());
  return <CategoryPage title="Notes" entries={notes} />;
}
