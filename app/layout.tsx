import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "LabyrintLab – Testa, jämför och förstå sökalgoritmer",
  description:
    "Ett pedagogiskt verktyg för att förutsäga, köra steg för steg och jämföra BFS, DFS, Greedy och A* i samma labyrint.",
};

export const viewport: Viewport = {
  themeColor: "#f6f7fb",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  );
}
