import { Inter, JetBrains_Mono } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const initTheme = `
  (function() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    if (dark) document.documentElement.classList.add("dark");
  })();
`;

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
        <link rel="stylesheet" href="/generated/vendor/katex.min.css" />
      </head>
      <body className={`${sansFont.variable} ${monoFont.variable} font-sans min-h-screen flex flex-col bg-background text-foreground`}>
        <Nav />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
