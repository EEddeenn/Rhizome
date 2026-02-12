import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rhizome",
  description: "A static personal notes system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
