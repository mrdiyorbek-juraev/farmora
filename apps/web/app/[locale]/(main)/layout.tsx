import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AskAi, AskAiProvider } from "@/components/ask-ai";
import { SiteHeader } from "@/components/site-header";

interface MainLayoutProps {
  readonly children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => (
  <AskAiProvider>
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
      <AskAi />
    </SidebarProvider>
  </AskAiProvider>
);

export default MainLayout;
