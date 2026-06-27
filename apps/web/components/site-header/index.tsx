"use client";

import { UserButton } from "@repo/auth/client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@repo/design-system/components/ui/breadcrumb";
import { Button } from "@repo/design-system/components/ui/button";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import { Separator } from "@repo/design-system/components/ui/separator";
import {
  SidebarTrigger,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { Search, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAskAi } from "@/components/ask-ai";
import { useGlobalModal } from "@/stores/shared/modal-store";

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
  const { setModal } = useGlobalModal();

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

      <div className="flex flex-1 justify-center px-2">
        <Button
          aria-label="Search animals"
          className="h-8 w-full max-w-sm justify-between gap-3 rounded-full bg-muted/40 px-3 font-normal text-muted-foreground hover:bg-muted/60"
          onClick={() => setModal({ search: { open: true } })}
          type="button"
          variant="outline"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" />
            <span>Search animals…</span>
          </span>
          <Kbd className="hidden h-5 px-1.5 text-[10px] sm:inline-flex">⌘K</Kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
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
