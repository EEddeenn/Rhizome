"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBar } from "./SearchBar";

const NAV_LINKS = [
  { href: "/notes", label: "Notes" },
  { href: "/articles", label: "Articles" },
  { href: "/tags", label: "Tags" },
  { href: "/graph", label: "Graph" },
];

const CloseIcon = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
);

const MenuIcon = (
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
);

export function Nav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded">
            Rhizome
          </Link>

          <div className="hidden md:flex items-center gap-4">
            <SearchBar />
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            <svg
              aria-hidden="true"
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? CloseIcon : MenuIcon}
            </svg>
          </button>
        </div>

        {isOpen ? (
          <div className="md:hidden pb-4 border-t border-border mt-0 pt-4">
            <div className="mb-4">
              <SearchBar fullWidth onSearch={() => setIsOpen(false)} />
            </div>
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-muted hover:text-foreground transition-colors py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-1"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="py-2">
                <ThemeToggle />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}
