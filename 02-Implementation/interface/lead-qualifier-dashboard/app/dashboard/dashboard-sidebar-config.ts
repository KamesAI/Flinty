export type DashboardSidebarIcon =
  | "home"
  | "campaigns"
  | "templates"
  | "inbox"
  | "meetings"
  | "data"
  | "new-campaign";

export interface DashboardSidebarItem {
  label: string;
  icon: DashboardSidebarIcon;
  href?: string;
  matchPrefixes?: string[];
}

export interface DashboardSidebarGroup {
  id: string;
  items: DashboardSidebarItem[];
}

export const DASHBOARD_APP_TITLE = "Kames CRM";
export const DASHBOARD_APP_SUBTITLE = "Lead gen dashboard";

export const dashboardSidebarGroups: DashboardSidebarGroup[] = [
  {
    id: "primary",
    items: [
      { label: "Dashboard", icon: "home", href: "/dashboard" },
      {
        label: "Campagnes",
        icon: "campaigns",
        href: "/dashboard/campaigns",
        matchPrefixes: ["/dashboard/campaigns"],
      },
      {
        label: "Templates",
        icon: "templates",
        href: "/dashboard/templates",
        matchPrefixes: ["/dashboard/templates"],
      },
      {
        label: "Inbox",
        icon: "inbox",
        href: "/dashboard/inbox",
        matchPrefixes: ["/dashboard/inbox"],
      },
      {
        label: "Meetings",
        icon: "meetings",
        href: "/dashboard/meetings",
        matchPrefixes: ["/dashboard/meetings"],
      },
      {
        label: "Donnees",
        icon: "data",
        href: "/dashboard/data",
        matchPrefixes: ["/dashboard/data"],
      },
    ],
  },
  {
    id: "actions",
    items: [
      {
        label: "Nouvelle campagne",
        icon: "new-campaign",
        href: "/dashboard/campaigns/new",
        matchPrefixes: ["/dashboard/campaigns/new"],
      },
    ],
  },
];
