"use client";

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
  PlusCircle,
  LogOut,
  Menu,
  Search,
  SunMedium,
} from "lucide-react";
import {
  DASHBOARD_APP_SUBTITLE,
  DASHBOARD_APP_TITLE,
  type DashboardSidebarIcon,
  type DashboardSidebarItem,
  dashboardSidebarGroups,
} from "./dashboard-sidebar-config";
import {
  DASHBOARD_THEME_STORAGE_KEY,
  type DashboardTheme,
  resolveDashboardTheme,
  toggleDashboardSidebar,
  toggleDashboardTheme,
} from "./dashboard-theme";

const iconMap: Record<DashboardSidebarIcon, typeof Home> = {
  home: Home,
  campaigns: FolderKanban,
  templates: FileText,
  inbox: Inbox,
  meetings: CalendarDays,
  data: BarChart3,
  "new-campaign": PlusCircle,
};

const themeStyles = {
  light: {
    shell: "bg-[#fafafa] text-[#111111]",
    rail: "bg-white text-[#6b6b69] border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
    panel: "bg-white text-[#111111] border-black/5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]",
    logo: "bg-black text-white",
    subtleText: "text-[#9f9f9c]",
    mutedText: "text-[#72726f]",
    divider: "border-black/6",
    search: "bg-[#fbfbfa] border-black/8 text-[#111111] placeholder:text-[#aaaaa7]",
    railButton: "text-[#666663] hover:bg-[#f4f4f2] hover:text-black",
    railButtonActive: "bg-[#f5f5f3] text-[#FFA318] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]",
    item: "text-[#6d6d69] hover:bg-[#f4f4f2] hover:text-black",
    itemActive: "bg-[#f5f5f3] text-[#FFA318] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]",
    main: "bg-[#fafafa] text-[#111111]",
    overlay: "bg-black/40",
  },
  dark: {
    shell: "bg-[#0c0c0d] text-white",
    rail: "bg-black text-[#7f7f82] border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
    panel: "bg-black text-white border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
    logo: "bg-white text-black",
    subtleText: "text-[#8e8e93]",
    mutedText: "text-[#737379]",
    divider: "border-white/10",
    search: "bg-[#141416] border-white/10 text-white placeholder:text-[#66666b]",
    railButton: "text-white hover:bg-[#101012]",
    railButtonActive: "bg-[#121214] text-[#FFA318] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
    item: "text-white hover:bg-[#101012]",
    itemActive: "bg-[#121214] text-[#FFA318] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]",
    main: "bg-[#050506] text-white",
    overlay: "bg-black/70",
  },
} as const;

function getInitialTheme(): DashboardTheme {
  return resolveDashboardTheme(undefined, false);
}

function isItemActive(item: DashboardSidebarItem, pathname: string): boolean {
  // Sur /dashboard exact, seul l'item Dashboard (sans matchPrefixes) est actif
  if (pathname === "/dashboard") {
    return item.href === "/dashboard" && !item.matchPrefixes?.length;
  }

  if (item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return item.href ? pathname === item.href : false;
}

function SidebarSearch({ theme }: { theme: DashboardTheme }) {
  const styles = themeStyles[theme];

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
  theme,
  compact = false,
  onSelect,
}: {
  item: DashboardSidebarItem;
  active: boolean;
  theme: DashboardTheme;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const Icon = iconMap[item.icon];
  const styles = themeStyles[theme];
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
  theme,
  compact = false,
  onSelect,
}: {
  pathname: string;
  theme: DashboardTheme;
  compact?: boolean;
  onSelect?: () => void;
}) {
  const styles = themeStyles[theme];

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
                theme={theme}
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

function SidebarBottomActions({
  theme,
  onToggleTheme,
  compact = false,
}: {
  theme: DashboardTheme;
  onToggleTheme: () => void;
  compact?: boolean;
}) {
  const styles = themeStyles[theme];
  const buttonClass = compact
    ? `flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`
    : `flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors ${styles.item}`;

  return (
    <div className={`${compact ? "mt-auto space-y-2 pt-5" : `mt-auto border-t pt-5 ${styles.divider}`}`}>
      <button type="button" className={buttonClass} onClick={onToggleTheme} aria-label="Switch mode">
        <SunMedium className={compact ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} strokeWidth={1.8} />
        {!compact && <span>Switch mode</span>}
      </button>
      <button type="button" className={buttonClass} aria-label="Log out">
        <LogOut className={compact ? "h-[18px] w-[18px]" : "h-[17px] w-[17px]"} strokeWidth={1.8} />
        {!compact && <span>Log out</span>}
      </button>
    </div>
  );
}

function ExpandedSidebar({
  pathname,
  theme,
  onToggleTheme,
  onSelect,
}: {
  pathname: string;
  theme: DashboardTheme;
  onToggleTheme: () => void;
  onSelect?: () => void;
}) {
  const styles = themeStyles[theme];

  return (
    <div className={`flex h-full w-full flex-col rounded-[30px] border px-5 py-4 ${styles.panel}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${styles.logo}`}>
          <div className="h-4 w-4 rounded-[5px] border-2 border-current" />
        </div>
        <div className="pt-0.5">
          <p className="text-sm font-semibold leading-none">{DASHBOARD_APP_TITLE}</p>
          <p className={`mt-1 text-xs ${styles.subtleText}`}>{DASHBOARD_APP_SUBTITLE}</p>
        </div>
      </div>

      <SidebarSearch theme={theme} />
      <SidebarGroups pathname={pathname} theme={theme} onSelect={onSelect} />
      <SidebarBottomActions theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}

function CompactSidebar({
  pathname,
  theme,
  expanded,
  onToggleTheme,
  onToggleExpanded,
}: {
  pathname: string;
  theme: DashboardTheme;
  expanded: boolean;
  onToggleTheme: () => void;
  onToggleExpanded: () => void;
}) {
  const styles = themeStyles[theme];

  return (
    <div className={`flex h-full w-[76px] flex-col items-center rounded-[30px] border px-3 py-4 ${styles.rail}`}>
      <button
        type="button"
        onClick={onToggleExpanded}
        className={`dashboard-keep-white flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${
          expanded ? styles.logo : theme === "light" ? "bg-black text-white hover:bg-zinc-800" : styles.railButtonActive
        }`}
        aria-label={expanded ? "Masquer le menu" : "Afficher le menu"}
      >
        <div className="h-4 w-4 rounded-[5px] border-2 border-current" />
      </button>

      <button
        type="button"
        className={`mt-5 flex h-10 w-10 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`}
        aria-label="Search"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </button>

      <SidebarGroups pathname={pathname} theme={theme} compact />
      <SidebarBottomActions theme={theme} onToggleTheme={onToggleTheme} compact />
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopExpanded, setDesktopExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<DashboardTheme>(getInitialTheme);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const storedTheme = window.localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
    setTheme(resolveDashboardTheme(storedTheme, prefersDark));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const styles = useMemo(() => themeStyles[theme], [theme]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#050506] text-white">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    );
  }

  return (
    <div
      className={`dashboard-theme-root flex min-h-screen ${styles.shell}`}
      data-dashboard-theme={theme}
    >
      <aside className={`hidden lg:flex shrink-0 px-6 py-6 transition-[gap] duration-300 ${desktopExpanded ? "gap-5" : "gap-0"}`}>
        <CompactSidebar
          pathname={pathname}
          theme={theme}
          expanded={desktopExpanded}
          onToggleTheme={() => setTheme(toggleDashboardTheme(theme))}
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
          <ExpandedSidebar
            pathname={pathname}
            theme={theme}
            onToggleTheme={() => setTheme(toggleDashboardTheme(theme))}
          />
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
            <div>
              <p className="text-sm font-semibold leading-none">{DASHBOARD_APP_TITLE}</p>
              <p className={`mt-1 text-xs ${styles.subtleText}`}>{DASHBOARD_APP_SUBTITLE}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTheme(toggleDashboardTheme(theme))}
            className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${styles.railButton}`}
            aria-label="Switch mode"
          >
            <SunMedium className="h-5 w-5" strokeWidth={1.8} />
          </button>
        </div>

        {mobileOpen && (
          <>
            <div
              className={`fixed inset-0 z-40 lg:hidden ${styles.overlay}`}
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-4 left-4 z-50 w-[300px] lg:hidden">
              <ExpandedSidebar
                pathname={pathname}
                theme={theme}
                onToggleTheme={() => setTheme(toggleDashboardTheme(theme))}
                onSelect={() => setMobileOpen(false)}
              />
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
