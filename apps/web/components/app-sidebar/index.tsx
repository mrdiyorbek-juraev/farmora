"use client";

import { OrganizationSwitcher } from "@repo/auth/client";
import { useTheme } from "@repo/design-system";
import { Button } from "@repo/design-system/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/design-system/components/ui/dropdown-menu";
import { Kbd } from "@repo/design-system/components/ui/kbd";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import {
  CircleHelp,
  Command,
  Monitor,
  Moon,
  Search,
  Sun,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

import { GlobalSearch } from "@/components/global-search";
import { navGroups } from "@/constants/navigation";
import { useGlobalModal } from "@/stores/shared/modal-store";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const activeOption =
    themeOptions.find((option) => option.value === theme) ?? themeOptions[2];
  const ActiveIcon = activeOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton tooltip="Theme">
          <ActiveIcon />
          <span>Theme</span>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
          >
            <option.icon />
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OrgSwitcher() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <OrganizationSwitcher
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
      appearance={
        collapsed
          ? {
              elements: {
                organizationPreviewTextContainer: { display: "none" },
                organizationSwitcherTriggerIcon: { display: "none" },
              },
            }
          : undefined
      }
      hidePersonal
    />
  );
}

export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setModal } = useGlobalModal();

  const openSearch = () => setModal({ search: { open: true } });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-2 border-border border-b group-data-[collapsible=icon]:items-center">
        <div className="flex h-8 items-center gap-1">
          <div className="flex-1 overflow-hidden">
            <OrgSwitcher />
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <div className="flex flex-1 flex-col gap-2 px-2 group-data-[collapsible=icon]:hidden pt-2">
          {/* Quick actions + search — opens the ⌘K command palette. */}
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Button
            className="flex-1 justify-between gap-2 px-2.5 font-normal text-muted-foreground"
            onClick={openSearch}
            type="button"
            variant="outline"
          >
            <span className="flex items-center gap-2">
              <Command className="size-4" />
              <span className="text-sm">Quick actions</span>
            </span>
            <Kbd className="h-5 px-1.5 text-[10px]">⌘K</Kbd>
          </Button>
          <Button
            aria-label="Search"
            className="shrink-0 gap-1.5 px-2.5 text-muted-foreground"
            onClick={openSearch}
            type="button"
            variant="outline"
          >
            <Search className="size-4" />
            <Kbd className="h-5 px-1.5 text-[10px]">/</Kbd>
          </Button>
        </div>

        {/* Collapsed (icon) rail: a single search affordance. */}
        <Button
          aria-label="Search"
          className="hidden size-8 text-muted-foreground group-data-[collapsible=icon]:flex"
          onClick={openSearch}
          size="icon"
          type="button"
          variant="outline"
        >
          <Search className="size-4" />
        </Button>
        </div>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname?.endsWith(item.href);
                  const isSoon = item.status === "soon";
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={
                          isSoon ? `${item.title} (coming soon)` : item.title
                        }
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                      {isSoon ? (
                        <SidebarMenuBadge className="text-[10px] text-muted-foreground uppercase">
                          Soon
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Invite teammates">
              <UserPlus />
              <span>Invite teammates</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Help">
              <CircleHelp />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <ThemeSwitcher />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Mounted once; renders only the command palette (portaled), */}
      {/* opened by the buttons above or the ⌘K / "/" hotkeys. */}
      <GlobalSearch />
    </Sidebar>
  );
}
