import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import { Providers } from "@/lib/providers";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { Toaster } from "@/components/layout/Toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Brutalist display face for oversized headings
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "RankForge — Competitive Programming Platform",
  description:
    "A competitive programming platform with temporal leaderboards, real-time contests, and advanced analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="h-full bg-background text-foreground overflow-hidden">
        {/* Apply saved theme before paint (default: dark) — avoids flash */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('rf-theme');if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();",
          }}
        />
        <ScrollProgress />
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
        <ThemeToggle />
        <CommandPalette />
        <Toaster />
      </body>
    </html>
  );
}
