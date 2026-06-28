import {
  SidebarInset,
  SidebarProvider,
} from "@repo/design-system/components/ui/sidebar";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AskAi, AskAiProvider } from "@/components/ask-ai";
import { OrgGate } from "@/components/org-gate";
import { SiteHeader } from "@/components/site-header";

interface MainLayoutProps {
  readonly children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => (
  <OrgGate>
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
  </OrgGate>
);

export default MainLayout;
