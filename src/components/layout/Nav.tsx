import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";

export function Nav() {
  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold">
            Rhizome
          </Link>
          <div className="flex items-center gap-4">
            <SearchBar />
            <div className="flex items-center gap-4">
              <Link
                href="/notes"
                className="text-muted hover:text-foreground transition-colors"
              >
                Notes
              </Link>
              <Link
                href="/articles"
                className="text-muted hover:text-foreground transition-colors"
              >
                Articles
              </Link>
              <Link
                href="/tags"
                className="text-muted hover:text-foreground transition-colors"
              >
                Tags
              </Link>
              <Link
                href="/graph"
                className="text-muted hover:text-foreground transition-colors"
                title="Knowledge Graph"
              >
                Graph
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
