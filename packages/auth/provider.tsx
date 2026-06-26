"use client";

import { ClerkLoaded, ClerkLoading, ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import type { Theme } from "@clerk/types";
import { useTheme } from "next-themes";
import type { ComponentProps, ReactNode } from "react";

type AuthProviderProperties = ComponentProps<typeof ClerkProvider> & {
  privacyUrl?: string;
  termsUrl?: string;
  helpUrl?: string;
  loadingComponent?: ReactNode;
};

const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isClerkConfigured = clerkKey.startsWith("pk_") && clerkKey.length > 20;

// TODO: re-enable once Clerk theme clashing is resolved
// function getCssVar(name: string): string {
//   if (typeof document === "undefined") {
//     return "";
//   }
//   return getComputedStyle(document.documentElement)
//     .getPropertyValue(name)
//     .trim();
// }

export const AuthProvider = ({
  privacyUrl,
  termsUrl,
  helpUrl,
  loadingComponent,
  children,
  ...properties
}: AuthProviderProperties) => {
  const { resolvedTheme } = useTheme();

  if (!isClerkConfigured) {
    return children;
  }

  const isDark = resolvedTheme === "dark";
  const theme = isDark ? dark : undefined;

  // TODO: re-enable custom variables once theme clashing is resolved
  const variables: Theme["variables"] = {
    // colorPrimary: getCssVar("--primary"),
    // colorDanger: getCssVar("--destructive"),
    // colorText: getCssVar("--foreground"),
    // colorTextSecondary: getCssVar("--muted-foreground"),
    // colorBackground: getCssVar("--background"),
    // colorInputBackground: getCssVar("--input"),
    // colorInputText: getCssVar("--foreground"),
    // colorNeutral: getCssVar("--foreground"),
    // borderRadius: getCssVar("--radius"),
    // fontFamily:
    //   "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    // fontFamilyButtons:
    //   "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    // fontSize: "13px",
    // fontWeight: {
    //   bold: "600",
    //   normal: "400",
    //   medium: "500",
    // },
  };

  // TODO: re-enable custom elements once theme clashing is resolved
  const elements: Theme["elements"] = {};

  const options: Theme["layout"] = {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
    privacyPageUrl: privacyUrl,
    termsPageUrl: termsUrl,
    helpPageUrl: helpUrl,
  };

  const sharedAppearance = { theme, variables, elements, options };

  return (
    <ClerkProvider
      {...properties}
      appearance={{
        ...sharedAppearance,
        signIn: sharedAppearance,
        signUp: sharedAppearance,
        userProfile: sharedAppearance,
        organizationProfile: sharedAppearance,
        createOrganization: sharedAppearance,
      }}
      taskUrls={{
        "choose-organization": "/organization-selection",
      }}
    >
      <ClerkLoading>{loadingComponent}</ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
};
