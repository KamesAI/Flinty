"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  FolderKanban,
  BarChart3,
  FileText,
  Home,
  Inbox,
  LogOut,
  Menu,
  Search,
} from "lucide-react";
import {
  type DashboardSidebarIcon,
  type DashboardSidebarItem,
  dashboardSidebarGroups,
} from "./dashboard-sidebar-config";
import { getDashboardThemeCssVariables, toggleDashboardSidebar } from "./dashboard-theme";

const iconMap: Record<DashboardSidebarIcon, typeof Home> = {
  home: Home,
  campaigns: FolderKanban,
  templates: FileText,
  inbox: Inbox,
  meetings: CalendarDays,
  data: BarChart3,
};

const styles = {
  shell: "bg-[#fafafa] text-[#111111]",
  rail: "bg-white text-[#6b6b69] border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
  panel: "bg-white text-[#111111] border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
  divider: "border-black/6",
  search: "bg-[#fbfbfa] border-black/8 text-[#111111] placeholder:text-[#aaaaa7]",
  railButton: "text-[#666663] hover:bg-[#f4f4f2] hover:text-black",
  railButtonActive: "bg-[#f5f5f3] text-[hsl(var(--primary))] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
  item: "text-[#6d6d69] hover:bg-[#f4f4f2] hover:text-black",
  itemActive: "bg-[#f5f5f3] text-[hsl(var(--primary))] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
  main: "bg-[#fafafa] text-[#111111]",
  overlay: "bg-black/40",
} as const;

function isItemActive(item: DashboardSidebarItem, pathname: string): boolean {
  if (pathname === "/dashboard") {
    return item.href === "/dashboard" && !item.matchPrefixes?.length;
  }

  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return item.href ? pathname === item.href : false;
}

function SidebarSearch() {
  return (
    <label
      className={`mt-6 flex h-11 items-center gap-3 rounded-2xl border px-4 text-sm ${styles.search}`}
    >
      <Search className="h-4 w-4 shrink-0" strokeWidth={1.8} />
      <input
        readOnly
        value=""
        placeholder="Search"
        className="w-full bg-transparent outline-none"
        aria-label="Search"
      />
    </label>
  );
}

function SidebarAction({
  item,
  active,
  compact = false,
  onSelect,
}: {
  item: DashboardSidebarItem;
  active: boolean;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const Icon = iconMap[item.icon];
  const baseClass = compact
    ? `flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${
        active ? styles.railButtonActive : styles.railButton
      }`
    : `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? styles.itemActive : styles.item
      }`;

  const content = (
    <>
      <Icon className={compact ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} strokeWidth={1.8} />
      {!compact && <span>{item.label}</span>}
    </>
  );

  if (!item.href) {
    return (
      <button type="button" className={baseClass} onClick={onSelect} aria-label={item.label}>
        {content}
      </button>
    );
  }

  return (
    <Link href={item.href} className={baseClass} onClick={onSelect} aria-label={item.label}>
      {content}
    </Link>
  );
}

function SidebarGroups({
  pathname,
  compact = false,
  onSelect,
}: {
  pathname: string;
  compact?: boolean;
  onSelect?: () => void;
}) {
  return (
    <>
      {dashboardSidebarGroups.map((group, index) => (
        <div
          key={group.id}
          className={`${index > 0 ? `mt-5 border-t pt-5 ${styles.divider}` : compact ? "mt-5" : "mt-6"}`}
        >
          <div className={compact ? "space-y-2" : "space-y-1.5"}>
            {group.items.map((item) => (
              <SidebarAction
                key={item.label}
                item={item}
                active={isItemActive(item, pathname)}
                compact={compact}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function SidebarBottomActions({ compact = false }: { compact?: boolean }) {
  const buttonClass = compact
    ? `flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`
    : `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${styles.item}`;

  return (
    <div className={`${compact ? "mt-auto space-y-2 pt-5" : `mt-auto border-t pt-5 ${styles.divider}`}`}>
      <button type="button" className={buttonClass} aria-label="Log out">
        <LogOut className={compact ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} strokeWidth={1.8} />
        {!compact && <span>Log out</span>}
      </button>
    </div>
  );
}

function ExpandedSidebar({ pathname, onSelect }: { pathname: string; onSelect?: () => void }) {
  return (
    <div className={`flex h-full w-full flex-col rounded-[30px] border px-5 py-4 ${styles.panel}`}>
      <div className="flex items-center px-1 pb-2 pt-1">
        <Image
          src="/logo-flinty-cropped.png"
          alt="Flinty"
          width={110}
          height={36}
          className="object-contain"
          priority
        />
      </div>

      <SidebarSearch />
      <SidebarGroups pathname={pathname} onSelect={onSelect} />
      <SidebarBottomActions />
    </div>
  );
}

function CompactSidebar({
  pathname,
  expanded,
  onToggleExpanded,
}: {
  pathname: string;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  return (
    <div className={`flex h-full w-[76px] flex-col items-center rounded-[30px] border px-3 py-4 ${styles.rail}`}>
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-black/5 bg-white transition-all duration-300"
        aria-label={expanded ? "Masquer le menu" : "Afficher le menu"}
      >
        <Image
          src="/logo-flinty-cropped.png"
          alt="Flinty"
          width={36}
          height={36}
          className="object-contain"
          priority
        />
      </button>

      <button
        type="button"
        className={`mt-5 flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`}
        aria-label="Search"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </button>

      <SidebarGroups pathname={pathname} compact />
      <SidebarBottomActions compact />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const cssVariables = useMemo(() => getDashboardThemeCssVariables(), []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#fafafa] text-[#111111]">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-theme-root flex min-h-screen ${styles.shell}`}
      data-dashboard-theme="light"
      style={cssVariables}
    >
      <aside className={`hidden lg:flex shrink-0 px-6 py-6 transition-[gap] duration-300 ${desktopExpanded ? "gap-5" : "gap-0"}`}>
        <CompactSidebar
          pathname={pathname}
          expanded={desktopExpanded}
          onToggleExpanded={() => setDesktopExpanded((current) => toggleDashboardSidebar(current))}
        />
        <div
          className={`overflow-hidden transition-[width,opacity,transform] duration-300 ease-out ${
            desktopExpanded
              ? "w-[262px] translate-x-0 opacity-100"
              : "w-0 -translate-x-4 opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-[262px]">
            <ExpandedSidebar pathname={pathname} />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={`sticky top-0 z-30 flex h-20 items-center justify-between border-b px-5 lg:hidden ${styles.panel}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <Image
              src="/logo-flinty-cropped.png"
              alt="Flinty"
              width={90}
              height={30}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {mobileOpen && (
          <>
            <div
              className={`fixed inset-0 z-40 lg:hidden ${styles.overlay}`}
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-4 left-4 z-50 w-[300px] lg:hidden">
              <ExpandedSidebar pathname={pathname} onSelect={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <main className={`flex-1 overflow-auto ${styles.main}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
