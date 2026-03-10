export type DashboardTheme = "light" | "dark";

export const DASHBOARD_THEME_STORAGE_KEY = "lead-gen-dashboard-theme";

export function resolveDashboardTheme(
  storedTheme: string | null | undefined,
  prefersDark: boolean
): DashboardTheme {
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return prefersDark ? "dark" : "light";
}

export function toggleDashboardTheme(theme: DashboardTheme): DashboardTheme {
  return theme === "light" ? "dark" : "light";
}

export function toggleDashboardSidebar(isOpen: boolean): boolean {
  return !isOpen;
}
