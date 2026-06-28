import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import { GlobalModals } from "@/components/modals";
import { Providers } from "@/lib/providers";

import "./styles.css";

const appUrl = process.env.NEXT_PUBLIC_WEB_URL;

export const metadata: Metadata = {
  metadataBase: appUrl ? new URL(appUrl) : undefined,
  title: {
    default: "Farmora — Cattle Management",
    template: "%s | Farmora",
  },
  description:
    "Manage your herd: track cattle, health status, weights, and farm activity in one place.",
  applicationName: "Farmora",
  // Private farm dashboard — keep it out of search indexes.
  robots: { index: false, follow: false },
  openGraph: {
    type: "website",
    siteName: "Farmora",
    title: "Farmora — Cattle Management",
    description:
      "Manage your herd: track cattle, health status, weights, and farm activity in one place.",
  },
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans-geist",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono-geist",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

interface RootLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
}

const RootLayout = async ({ children }: RootLayoutProperties) => {
  return (
    <html className="dark" lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <GlobalModals />
        </Providers>
      </body>
    </html>
  );
};

export default RootLayout;
