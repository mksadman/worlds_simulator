import type { Metadata } from "next";
import { Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import "./globals.css";

// Condensed display type for headings, close to the Worlds 2026 broadcast lettering.
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "800"], variable: "--font-condensed" });

export const metadata: Metadata = {
  title: "Worlds 2026 Simulator",
  description: "Pick or simulate the Worlds 2026 Swiss stage and knockouts, with fixed seeds and Elo-style odds.",
};

// Applies the saved theme before first paint so light-mode users don't see a dark flash.
const themeScript = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={condensed.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
          <div className="broadcast-strip" />
          <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-4 px-4">
            <Link href="/" className="flex items-baseline gap-2 font-display text-xl font-extrabold uppercase tracking-wide">
              <span>Worlds 2026</span>
              <span className="text-gradient hidden sm:inline">Simulator</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link href="/about" className="rounded-md px-3 py-1.5 text-muted hover:bg-panel-2 hover:text-text">
                About
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
