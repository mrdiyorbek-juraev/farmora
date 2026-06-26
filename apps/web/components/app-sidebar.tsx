"use client";

import { OrganizationSwitcher } from "@repo/auth/client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@repo/design-system/components/ui/sidebar";
import { CircleHelp, LayoutDashboard, List, UserPlus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

const nav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Herd List", href: "/herd", icon: List },
];

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

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-border border-b h-12 group-data-[collapsible=icon]:items-center">
        <div className="flex items-center gap-1">
          <div className="flex-1 overflow-hidden">
            <OrgSwitcher />
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {nav.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.endsWith(item.href) ||
                  false;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
