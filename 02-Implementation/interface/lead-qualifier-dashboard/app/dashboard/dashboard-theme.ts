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

export function getDashboardThemeCssVariables(
  theme: DashboardTheme
): Record<string, string> {
  if (theme === "light") {
    return {
      "--dashboard-card-bg": "rgba(255, 255, 255, 0.92)",
      "--dashboard-card-bg-muted": "rgba(247, 247, 245, 0.96)",
      "--dashboard-border": "rgba(17, 17, 17, 0.08)",
      "--dashboard-border-strong": "rgba(17, 17, 17, 0.16)",
      "--dashboard-text-primary": "#111111",
      "--dashboard-text-secondary": "#6d6d69",
      "--dashboard-text-muted": "#9f9f9c",
    };
  }

  return {
    "--dashboard-card-bg": "rgba(10, 10, 12, 0.88)",
    "--dashboard-card-bg-muted": "rgba(20, 20, 22, 0.96)",
    "--dashboard-border": "rgba(255, 255, 255, 0.10)",
    "--dashboard-border-strong": "rgba(255, 255, 255, 0.18)",
    "--dashboard-text-primary": "#ffffff",
    "--dashboard-text-secondary": "#8e8e93",
    "--dashboard-text-muted": "#737379",
  };
}
