export function toggleDashboardSidebar(isOpen: boolean): boolean {
  return !isOpen;
}

/** Thème unique : app en mode clair (fond blanc / cartes légèrement teintées). */
export function getDashboardThemeCssVariables(): Record<string, string> {
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
