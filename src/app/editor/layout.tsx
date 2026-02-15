import { Inter, JetBrains_Mono } from "next/font/google";

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const initTheme = `
  (function() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    if (dark) document.documentElement.classList.add("dark");
  })();
`;

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
        <script dangerouslySetInnerHTML={{ __html: initTheme }} />
        {/* eslint-disable-next-line @next/next/no-css-tags -- KaTeX CSS must be loaded manually for editor route */}
        <link rel="stylesheet" href="/generated/vendor/katex.min.css" />
      </head>
      <body className={`${sansFont.variable} ${monoFont.variable} font-sans bg-background text-foreground`}>
        {children}
      </body>
    </html>
  );
}
