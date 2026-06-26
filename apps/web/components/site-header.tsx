"use client";

import { UserButton } from "@repo/auth/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@repo/design-system/components/ui/breadcrumb";
import { Button } from "@repo/design-system/components/ui/button";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  SidebarTrigger,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAskAi } from "@/components/ask-ai";

const titles: Record<string, string> = {
  dashboard: "Dashboard",
  herd: "Herd List",
};

function deriveTitle(pathname: string | null): string {
  if (!pathname) {
    return "Dashboard";
  }
  const segments = pathname.split("/").filter(Boolean);
  const last = segments.at(-1);
  return (last && titles[last]) ?? "Dashboard";
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = deriveTitle(pathname);
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { toggle: toggleAskAi } = useAskAi();

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      {collapsed ? (
        <>
          <SidebarTrigger />
          <Separator className="mx-1 h-4" orientation="vertical" />
        </>
      ) : null}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <Button onClick={toggleAskAi} size="sm" variant="outline">
          <Sparkles />
          Ask AI
        </Button>
        <Separator className="mx-1 h-4" orientation="vertical" />
        <UserButton />
      </div>
    </header>
  );
}
