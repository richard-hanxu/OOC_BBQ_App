import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Geist } from "next/font/google";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "OOC BBQ",
    template: "%s · OOC BBQ",
  },
  description: "Private party game. Judge ridiculous situations, get your party type, find who you agree with.",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  applicationName: "Pool Party Personality",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Party" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0a1a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} h-full antialiased dark`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
