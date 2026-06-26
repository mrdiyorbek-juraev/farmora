"use client";

import { AuthProvider } from "@repo/auth/provider";
import { DesignSystemProvider } from "@repo/design-system";
import { ConfirmDialogProvider } from "@repo/design-system/components/composed/confirm-dialog";
import { Toaster } from "@repo/design-system/components/ui/sonner";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { type ReactNode, useEffect, useState } from "react";
import { HotkeysProvider } from "react-hotkeys-hook";
import Loader from "@/components/loaders";
import { getQueryClient } from "../query-client";


type Props = Readonly<{ children: ReactNode }>;


export function Providers({ children }: Props) {
  const queryClient = getQueryClient();
  const [mounted, setMounted] = useState(() => false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loader />;
  }

  return (
    <DesignSystemProvider>
      <AuthProvider loadingComponent={<Loader />}>
        <QueryClientProvider client={queryClient}>
          <HotkeysProvider>
            <NuqsAdapter>
              <ConfirmDialogProvider>
                {children}
                <Toaster />
              </ConfirmDialogProvider>
            </NuqsAdapter>
          </HotkeysProvider>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </AuthProvider>
    </DesignSystemProvider>
  );
}