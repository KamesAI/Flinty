"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, FolderKanban, FileText, Inbox,
  CalendarDays, BarChart3, Search, LogOut, Plus,
  ChevronDown, LayoutGrid, Table2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";
import { useEffect, useState } from "react";

interface NavChild {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavItem {
  /** Absent si le parent n'est qu'un groupe (ex. Campagnes) : pas de navigation au clic, seulement déplier. */
  href?: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { href: "/dashboard",           label: "Dashboard",  icon: LayoutDashboard, exact: true },
  {
    label: "Campagnes",
    icon: FolderKanban,
    children: [
      { href: "/dashboard/campaigns/overview",        label: "Overview",        icon: LayoutGrid },
      { href: "/dashboard/campaigns/suivi-detaille",  label: "Suivi détaillé",  icon: Table2 },
    ],
  },
  { href: "/dashboard/templates", label: "Configuration",   icon: FileText },
  { href: "/dashboard/inbox",     label: "Messagerie",      icon: Inbox },
  { href: "/dashboard/meetings",  label: "Calendrier",   icon: CalendarDays },
  { href: "/dashboard/data",      label: "Data",       icon: BarChart3 },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";
    try {
      localStorage.removeItem("theme");
      localStorage.removeItem("lead-gen-dashboard-theme");
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          "relative z-20 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out shrink-0",
          collapsed ? "w-[76px]" : "w-[260px]"
        )}
      >
        {/* Brand */}
        <div className={cn("px-3 py-5", collapsed && "flex justify-center px-2")}>
          {collapsed ? (
            <div className="relative h-9 w-9">
              <Image
                src="/logo-flinty-cropped.png"
                alt="Flinty"
                fill
                className="object-contain"
                priority
              />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-10 w-full"
            >
              <Image
                src="/logo-flinty-cropped.png"
                alt="Flinty"
                fill
                className="object-contain object-center"
                priority
              />
            </motion.div>
          )}
        </div>

        {/* Search */}
        <div className={cn("px-3", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex w-full items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Search className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Search · ⌘K</TooltipContent>
            </Tooltip>
          ) : (
            <button className="group flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground">
              <Search className="size-4" />
              <span className="flex-1">Search</span>
              <kbd className="rounded border border-sidebar-border bg-sidebar px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className={cn("mt-4 flex-1 space-y-0.5 px-3", collapsed && "px-2")}>
          {navItems.map((item) =>
            item.children ? (
              <NavGroup
                key={item.label}
                item={item}
                collapsed={collapsed}
                pathname={pathname}
                onRequestExpand={onToggle}
              />
            ) : (
              <NavLeaf
                key={item.href}
                item={item as NavItem & { href: string }}
                collapsed={collapsed}
                pathname={pathname}
              />
            )
          )}
        </nav>

        {/* New campaign CTA */}
        <div className={cn("px-3 pb-3", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" className="w-full" asChild>
                  <Link href="/dashboard/campaigns/new">
                    <Plus className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New campaign</TooltipContent>
            </Tooltip>
          ) : (
            <Button className="w-full justify-start gap-2 bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/dashboard/campaigns/new">
                <Plus className="size-4" />
                New campaign
              </Link>
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className={cn(
          "flex items-center gap-3 border-t border-sidebar-border px-4 py-3",
          collapsed && "flex-col gap-2 px-2"
        )}>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-foreground">
            TC
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-foreground">Thomas C.</div>
              <div className="truncate text-[11px] text-muted-foreground">kames.ai</div>
            </div>
          )}
          <div className={cn("flex items-center gap-1", collapsed && "flex-col")}>
            <button className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function useSidebarState() {
  const [collapsed, setCollapsed] = useState(false);
  return { collapsed, toggle: () => setCollapsed((v) => !v) };
}

function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.children?.length) {
    return pathname.startsWith("/dashboard/campaigns");
  }
  if (item.exact) return pathname === item.href;
  if (!item.href) return false;
  return pathname.startsWith(item.href);
}

function NavLeaf({
  item,
  collapsed,
  pathname,
}: {
  item: NavItem & { href: string };
  collapsed: boolean;
  pathname: string;
}) {
  const Icon = item.icon;
  const active = isItemActive(item, pathname);

  const link = (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
        collapsed && "justify-center px-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
        />
      )}
      <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  ) : (
    <div>{link}</div>
  );
}

function NavGroup({
  item,
  collapsed,
  pathname,
  onRequestExpand,
}: {
  item: NavItem;
  collapsed: boolean;
  pathname: string;
  onRequestExpand: () => void;
}) {
  const Icon = item.icon;
  const active = isItemActive(item, pathname);
  const [open, setOpen] = useState(active);

  useEffect(() => {
    if (active) setOpen(true);
  }, [active]);

  if (collapsed) {
    const railButton = (
      <button
        type="button"
        onClick={onRequestExpand}
        className={cn(
          "group relative flex w-full items-center justify-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all",
          active
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
        )}
      >
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
      </button>
    );

    return (
      <Tooltip>
        <TooltipTrigger asChild>{railButton}</TooltipTrigger>
        <TooltipContent side="right">{item.label} — déplier le menu</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-all",
          active
            ? "bg-primary/10 text-primary"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
        )}
      >
        {active && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
          />
        )}
        <Icon className={cn("size-[18px] shrink-0", active && "text-primary")} />
        <span className="flex-1 truncate">{item.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && item.children && (
        <div className="mt-0.5 space-y-0.5 pl-5">
          {item.children.map((child) => {
            const ChildIcon = child.icon;
            const childActive = pathname.startsWith(child.href);
            return (
              <Link
                key={child.href}
                href={child.href}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all",
                  childActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                {childActive && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-primary"
                  />
                )}
                <ChildIcon className={cn("size-[15px] shrink-0", childActive && "text-primary")} />
                <span className="truncate">{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
