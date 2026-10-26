import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./anvaya.css";

const inter = localFont({
  src: [
    { path: "../public/fonts/inter-400.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/inter-500.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/inter-600.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/inter-700.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});
const newsreader = localFont({
  src: [
    { path: "../public/fonts/newsreader-400.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/newsreader-500.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/newsreader-600.ttf", weight: "600", style: "normal" },
  ],
  variable: "--font-newsreader",
  display: "swap",
});
const devanagari = localFont({ src: "../public/fonts/noto-devanagari-400.ttf", variable: "--font-devanagari", display: "swap" });

export const metadata: Metadata = { title: "Anvaya — public policy, made legible", description: "Independent, citizen-first intelligence for Indian public policy." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${inter.variable} ${newsreader.variable} ${devanagari.variable}`}>{children}</body></html>;
}
