import { Providers } from "@/lib/providers";
import "./styles.css";
import { AuthProvider } from "@repo/auth/provider";
import { DesignSystemProvider } from "@repo/design-system";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";

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
    <html
      className="dark" lang="en" suppressHydrationWarning
    >
      <body  className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body> 
    </html>
  );
};

export default RootLayout;
