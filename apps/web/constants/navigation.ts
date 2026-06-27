import {
  Banknote,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  List,
  type LucideIcon,
  Milk,
  Package,
  Settings,
  Sparkles,
  Sprout,
  Store,
  Tractor,
  TrendingUp,
  Users,
  Venus,
  Wheat,
} from "lucide-react";

export type NavStatus = "ready" | "soon";

export interface NavItem {
  /** One-line blurb shown on the coming-soon placeholder page. */
  description?: string;
  /** URL path under the locale, e.g. "/dashboard" or "/breeding". */
  href: string;
  icon: LucideIcon;
  status: NavStatus;
  title: string;
}

export interface NavGroup {
  items: NavItem[];
  label: string;
}

// Single source of truth for the sidebar AND the coming-soon route.
// Flip an item's `status` to "ready" (and point `href` at its real
// route) as each feature ships.
export const navGroups: NavGroup[] = [
  {
    label: "Livestock",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        status: "ready",
      },
      { title: "Herd", href: "/herd", icon: List, status: "ready" },
      {
        title: "Breeding",
        href: "/breeding",
        icon: Venus,
        status: "soon",
        description:
          "Heat detection, insemination records, pregnancy checks, and a calving calendar.",
      },
      {
        title: "Health",
        href: "/health",
        icon: HeartPulse,
        status: "soon",
        description:
          "Treatments, vaccinations, vet visits, and withdrawal-period tracking.",
      },
      {
        title: "Production",
        href: "/production",
        icon: Milk,
        status: "soon",
        description:
          "Daily milk yield per cow, lactation cycles, and drying-off scheduling.",
      },
      {
        title: "Growth",
        href: "/growth",
        icon: TrendingUp,
        status: "soon",
        description:
          "Weight and average-daily-gain trends rolled up across the whole herd.",
      },
    ],
  },
  {
    label: "Land & Resources",
    items: [
      {
        title: "Paddocks",
        href: "/paddocks",
        icon: Sprout,
        status: "soon",
        description:
          "Pasture map, grazing rotation, and which herd is on which paddock.",
      },
      {
        title: "Feed",
        href: "/feed",
        icon: Wheat,
        status: "soon",
        description: "Rations, feed consumption, and nutrition planning.",
      },
      {
        title: "Supplies",
        href: "/supplies",
        icon: Package,
        status: "soon",
        description:
          "Inventory for medicine, feed, and semen straws with low-stock alerts.",
      },
      {
        title: "Machinery",
        href: "/machinery",
        icon: Tractor,
        status: "soon",
        description: "Equipment register and maintenance schedules.",
      },
    ],
  },
  {
    label: "Planning",
    items: [
      {
        title: "Tasks",
        href: "/tasks",
        icon: ClipboardList,
        status: "soon",
        description: "Assign and track day-to-day farm to-dos.",
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        status: "soon",
        description:
          "Vaccinations due, calving dates, and drying-off reminders in one view.",
      },
    ],
  },
  {
    label: "Business",
    items: [
      {
        title: "Finance",
        href: "/finance",
        icon: Banknote,
        status: "soon",
        description: "Income, expenses, cost-per-animal, and profit & loss.",
      },
      {
        title: "Market",
        href: "/market",
        icon: Store,
        status: "soon",
        description: "Sell animals, track buyers, and watch market prices.",
      },
    ],
  },
  {
    label: "Organization",
    items: [
      {
        title: "Team",
        href: "/team",
        icon: Users,
        status: "soon",
        description: "Manage members and roles across your organization.",
      },
      {
        title: "Farm AI",
        href: "/farm-ai",
        icon: Sparkles,
        status: "soon",
        description:
          "Ask questions about your herd and get AI-assisted recommendations.",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        status: "soon",
        description: "Units, breed configuration, and organization profile.",
      },
    ],
  },
];

// Flat lookup of soon-features by slug (path without the leading "/"),
// used by the shared coming-soon route to resolve the title/copy and to
// 404 on genuinely unknown paths.
const soonBySlug = new Map<string, NavItem>();
for (const group of navGroups) {
  for (const item of group.items) {
    if (item.status === "soon") {
      soonBySlug.set(item.href.replace(/^\//, ""), item);
    }
  }
}

export function findSoonFeature(slug: string): NavItem | undefined {
  return soonBySlug.get(slug);
}
