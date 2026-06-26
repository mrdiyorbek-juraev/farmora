import "./styles.css";
import { ClerkProvider } from "@clerk/nextjs";
import { DesignSystemProvider } from "@repo/design-system";
import { fonts } from "@repo/design-system/lib/fonts";
import { cn } from "@repo/design-system/lib/utils";
import type { ReactNode } from "react";

interface RootLayoutProperties {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
}

const RootLayout = async ({ children }: RootLayoutProperties) => {
  return (
    <html
      className={cn(fonts, "scroll-smooth")}
      lang="en"
      suppressHydrationWarning
    >
      <body>
        <ClerkProvider>
          <DesignSystemProvider>{children}</DesignSystemProvider>
        </ClerkProvider>
      </body>
    </html>
  );
};

export default RootLayout;
